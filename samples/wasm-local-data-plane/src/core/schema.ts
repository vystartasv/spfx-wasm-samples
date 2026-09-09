export interface SqlExecutor { exec(config: { sql: string; bind?: unknown[] }): void; }

export const MIGRATIONS: readonly string[] = [
  `CREATE TABLE IF NOT EXISTS runtime_metadata (key TEXT PRIMARY KEY, value TEXT NOT NULL);\nCREATE TABLE IF NOT EXISTS migrations (version INTEGER PRIMARY KEY, applied_at INTEGER NOT NULL);`,
  `CREATE TABLE IF NOT EXISTS users (namespace TEXT NOT NULL, id TEXT NOT NULL, display_name TEXT NOT NULL, mail TEXT NOT NULL, department TEXT NOT NULL, changed_at INTEGER NOT NULL, deleted INTEGER NOT NULL DEFAULT 0, PRIMARY KEY(namespace,id));\nCREATE TABLE IF NOT EXISTS projects (namespace TEXT NOT NULL, id TEXT NOT NULL, name TEXT NOT NULL, owner_id TEXT NOT NULL, status TEXT NOT NULL, changed_at INTEGER NOT NULL, deleted INTEGER NOT NULL DEFAULT 0, PRIMARY KEY(namespace,id));\nCREATE TABLE IF NOT EXISTS crm_contacts (namespace TEXT NOT NULL, id TEXT NOT NULL, name TEXT NOT NULL, email TEXT NOT NULL, account TEXT NOT NULL, changed_at INTEGER NOT NULL, deleted INTEGER NOT NULL DEFAULT 0, PRIMARY KEY(namespace,id));`,
  `CREATE TABLE IF NOT EXISTS canonical_entities (namespace TEXT NOT NULL, canonical_id TEXT NOT NULL, entity_type TEXT NOT NULL, display_name TEXT NOT NULL, changed_at INTEGER NOT NULL, PRIMARY KEY(namespace,canonical_id));\nCREATE TABLE IF NOT EXISTS source_identities (namespace TEXT NOT NULL, source TEXT NOT NULL, source_id TEXT NOT NULL, canonical_id TEXT NOT NULL, confidence REAL NOT NULL, PRIMARY KEY(namespace,source,source_id));\nCREATE TABLE IF NOT EXISTS sync_sources (namespace TEXT NOT NULL, source TEXT NOT NULL, next_link TEXT, delta_link TEXT, last_synced_at INTEGER, PRIMARY KEY(namespace,source));`,
  `CREATE TABLE IF NOT EXISTS sync_outbox (namespace TEXT NOT NULL, id TEXT NOT NULL, entity_type TEXT NOT NULL, entity_id TEXT NOT NULL, operation TEXT NOT NULL, payload TEXT NOT NULL, base_changed_at INTEGER, state TEXT NOT NULL, attempts INTEGER NOT NULL DEFAULT 0, created_at INTEGER NOT NULL, PRIMARY KEY(namespace,id));\nCREATE TABLE IF NOT EXISTS sync_conflicts (namespace TEXT NOT NULL, id TEXT NOT NULL, entity_type TEXT NOT NULL, entity_id TEXT NOT NULL, local_payload TEXT NOT NULL, remote_payload TEXT NOT NULL, state TEXT NOT NULL, created_at INTEGER NOT NULL, PRIMARY KEY(namespace,id));\nCREATE INDEX IF NOT EXISTS projects_owner_idx ON projects(namespace,owner_id);\nCREATE INDEX IF NOT EXISTS projects_status_idx ON projects(namespace,status);\nCREATE INDEX IF NOT EXISTS contacts_email_idx ON crm_contacts(namespace,email);\nCREATE INDEX IF NOT EXISTS identities_canonical_idx ON source_identities(namespace,canonical_id);`,
  `CREATE VIEW IF NOT EXISTS person_360 AS SELECT u.namespace, u.id AS user_id, u.display_name, u.mail, u.department, c.id AS contact_id, c.account FROM users u LEFT JOIN crm_contacts c ON c.namespace=u.namespace AND lower(c.email)=lower(u.mail) WHERE u.deleted=0 AND (c.deleted=0 OR c.id IS NULL);\nCREATE VIEW IF NOT EXISTS project_showcase AS SELECT p.namespace, p.id AS project_id, p.name AS project_name, p.status AS project_status, p.owner_id, u.display_name AS owner_name, u.mail AS owner_mail, c.name AS contact_name, c.account AS contact_account FROM projects p LEFT JOIN users u ON u.namespace=p.namespace AND u.id=p.owner_id AND u.deleted=0 LEFT JOIN crm_contacts c ON c.namespace=u.namespace AND lower(c.email)=lower(u.mail) AND c.deleted=0 WHERE p.deleted=0;`
];

export function applyMigrations(executor: SqlExecutor, now = Date.now()): void {
  executor.exec({ sql: 'BEGIN' });
  try {
    MIGRATIONS.forEach((sql, index) => {
      executor.exec({ sql });
      executor.exec({ sql: 'INSERT OR IGNORE INTO migrations(version, applied_at) VALUES (?, ?)', bind: [index + 1, now] });
    });
    executor.exec({ sql: 'COMMIT' });
  } catch (error) {
    executor.exec({ sql: 'ROLLBACK' });
    throw error;
  }
}
