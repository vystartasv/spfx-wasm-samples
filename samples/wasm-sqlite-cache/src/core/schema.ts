export interface SqlExecutor { exec(config: { sql: string; bind?: unknown[] }): unknown; }
export const MIGRATIONS = [
  'CREATE TABLE IF NOT EXISTS migrations (version INTEGER PRIMARY KEY, applied_at INTEGER NOT NULL);',
  'CREATE TABLE IF NOT EXISTS items (namespace TEXT NOT NULL, id TEXT NOT NULL, title TEXT NOT NULL, category TEXT NOT NULL, amount REAL NOT NULL, updated_at INTEGER NOT NULL, deleted INTEGER NOT NULL DEFAULT 0, PRIMARY KEY(namespace,id)); CREATE INDEX IF NOT EXISTS items_category ON items(namespace,category);',
  'CREATE TABLE IF NOT EXISTS outbox (namespace TEXT NOT NULL, id TEXT NOT NULL, item_id TEXT NOT NULL, operation TEXT NOT NULL, payload TEXT NOT NULL, state TEXT NOT NULL, error TEXT, created_at INTEGER NOT NULL, PRIMARY KEY(namespace,id)); CREATE TABLE IF NOT EXISTS conflicts (namespace TEXT NOT NULL, id TEXT NOT NULL, local_payload TEXT NOT NULL, remote_payload TEXT NOT NULL, created_at INTEGER NOT NULL, PRIMARY KEY(namespace,id));',
  'CREATE TABLE IF NOT EXISTS metadata (namespace TEXT PRIMARY KEY, last_sync TEXT);'
] as const;
export function applyMigrations(db: SqlExecutor, now = Date.now()): void { db.exec({ sql: 'BEGIN' }); try { MIGRATIONS.forEach((sql, i) => { db.exec({ sql }); db.exec({ sql: 'INSERT OR IGNORE INTO migrations(version,applied_at) VALUES(?,?)', bind: [i + 1, now] }); }); db.exec({ sql: 'COMMIT' }); } catch (error) { db.exec({ sql: 'ROLLBACK' }); throw error; } }
