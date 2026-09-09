import { applyMigrations } from './schema';
import { ContactRecord, Namespace, ProjectRecord, QueryOptions, ShowcaseRow, SourceState, Status, UserRecord } from './types';

interface SqliteDb { exec(config: { sql: string; bind?: unknown[]; returnValue?: string; rowMode?: string }): unknown; close(): void; }
interface SqliteModule { version: { libVersion: string }; oo1: { DB: new (filename: string, mode?: string) => SqliteDb; OpfsDb?: new (filename: string) => SqliteDb }; }
export type StorageKind = 'opfs' | 'memory';

const namespaceKey = (namespace: Namespace): string => JSON.stringify([namespace.tenantId, namespace.userObjectId, namespace.applicationId]);
const rows = <T>(db: SqliteDb, sql: string, bind: unknown[] = []): T[] => db.exec({ sql, bind, returnValue: 'resultRows', rowMode: 'object' }) as T[];

export class SqliteStore {
  private db?: SqliteDb;
  private module?: SqliteModule;
  private namespace?: Namespace;
  private storage: StorageKind = 'memory';
  private lastError: string | null = null;

  async open(sqlite3: SqliteModule, namespace: Namespace): Promise<Status> {
    this.module = sqlite3;
    this.namespace = namespace;
    this.lastError = null;
    try {
      if (sqlite3.oo1.OpfsDb) {
        this.db = new sqlite3.oo1.OpfsDb(`/wasm-local-data-plane-${btoa(namespaceKey(namespace)).replace(/[^a-z0-9]/gi, '').slice(0, 48)}.sqlite3`);
        this.storage = 'opfs';
      } else throw new Error('OPFS unavailable in this browser context.');
    } catch (error) {
      this.lastError = error instanceof Error ? error.message : String(error);
      this.db = new sqlite3.oo1.DB(':memory:', 'c');
      this.storage = 'memory';
    }
    applyMigrations(this.db);
    this.exec('INSERT OR REPLACE INTO runtime_metadata(key,value) VALUES (?,?)', [`namespace:${namespaceKey(namespace)}`, JSON.stringify({ namespace, storage: this.storage })]);
    return this.status(true);
  }

  static async create(namespace: Namespace): Promise<SqliteStore> {
    const store = new SqliteStore();
    const sqlite3 = await (await import('@sqlite.org/sqlite-wasm')).default();
    await store.open(sqlite3 as unknown as SqliteModule, namespace);
    return store;
  }

  private requireDb(): SqliteDb { if (!this.db) throw new Error('SQLite store is not initialized.'); return this.db; }
  private requireNamespace(): string { if (!this.namespace) throw new Error('Namespace is not initialized.'); return namespaceKey(this.namespace); }
  private exec(sql: string, bind: unknown[] = []): void { this.requireDb().exec({ sql, bind }); }
  private transaction(work: () => void): void { this.exec('BEGIN'); try { work(); this.exec('COMMIT'); } catch (error) { this.exec('ROLLBACK'); throw error; } }
  private writeUsers(records: UserRecord[]): void { const ns = this.requireNamespace(); records.forEach(r => this.exec('INSERT INTO users(namespace,id,display_name,mail,department,changed_at,deleted) VALUES(?,?,?,?,?,?,?) ON CONFLICT(namespace,id) DO UPDATE SET display_name=excluded.display_name,mail=excluded.mail,department=excluded.department,changed_at=excluded.changed_at,deleted=excluded.deleted WHERE excluded.changed_at>=users.changed_at', [ns, r.id, r.displayName, r.mail, r.department, r.changedAt, r.deleted ? 1 : 0])); }
  private writeProjects(records: ProjectRecord[]): void { const ns = this.requireNamespace(); records.forEach(r => this.exec('INSERT INTO projects(namespace,id,name,owner_id,status,changed_at,deleted) VALUES(?,?,?,?,?,?,?) ON CONFLICT(namespace,id) DO UPDATE SET name=excluded.name,owner_id=excluded.owner_id,status=excluded.status,changed_at=excluded.changed_at,deleted=excluded.deleted WHERE excluded.changed_at>=projects.changed_at', [ns, r.id, r.name, r.ownerId, r.status, r.changedAt, r.deleted ? 1 : 0])); }
  private writeContacts(records: ContactRecord[]): void { const ns = this.requireNamespace(); records.forEach(r => this.exec('INSERT INTO crm_contacts(namespace,id,name,email,account,changed_at,deleted) VALUES(?,?,?,?,?,?,?) ON CONFLICT(namespace,id) DO UPDATE SET name=excluded.name,email=excluded.email,account=excluded.account,changed_at=excluded.changed_at,deleted=excluded.deleted WHERE excluded.changed_at>=crm_contacts.changed_at', [ns, r.id, r.name, r.email, r.account, r.changedAt, r.deleted ? 1 : 0])); }

  upsertUsers(records: UserRecord[]): void { this.transaction(() => this.writeUsers(records)); }
  upsertProjects(records: ProjectRecord[]): void { this.transaction(() => this.writeProjects(records)); }
  upsertContacts(records: ContactRecord[]): void { this.transaction(() => this.writeContacts(records)); }

  setSource(source: string, nextLink: string | null, deltaLink: string | null, syncedAt: number | null): void { this.exec('INSERT INTO sync_sources(namespace,source,next_link,delta_link,last_synced_at) VALUES(?,?,?,?,?) ON CONFLICT(namespace,source) DO UPDATE SET next_link=excluded.next_link,delta_link=COALESCE(excluded.delta_link,sync_sources.delta_link),last_synced_at=excluded.last_synced_at', [this.requireNamespace(), source, nextLink, deltaLink, syncedAt]); }
  applySyncPage(source: string, kind: 'users' | 'projects' | 'contacts', items: Array<UserRecord | ProjectRecord | ContactRecord>, nextLink: string | null, deltaLink: string | null): void {
    this.transaction(() => {
      if (kind === 'users') this.writeUsers(items as UserRecord[]);
      if (kind === 'projects') this.writeProjects(items as ProjectRecord[]);
      if (kind === 'contacts') this.writeContacts(items as ContactRecord[]);
      this.setSource(source, nextLink, deltaLink, nextLink ? null : Date.now());
    });
  }
  sourceStates(): SourceState[] { return rows<SourceState>(this.requireDb(), 'SELECT source,next_link AS nextLink,delta_link AS deltaLink,last_synced_at AS lastSyncedAt FROM sync_sources WHERE namespace=? ORDER BY source', [this.requireNamespace()]); }
  query(options: QueryOptions = {}): ShowcaseRow[] { const ns = this.requireNamespace(); const clauses = ['namespace=?', '1=1']; const bind: unknown[] = [ns]; if (options.status) { clauses.push('project_status=?'); bind.push(options.status); } if (options.text) { clauses.push('(lower(project_name) LIKE ? OR lower(owner_name) LIKE ? OR lower(owner_mail) LIKE ?)'); const text = `%${options.text.toLowerCase()}%`; bind.push(text, text, text); } const order = options.sort === 'owner' ? 'owner_name,project_name' : 'project_name'; bind.push(options.limit || 50); return rows<ShowcaseRow>(this.requireDb(), `SELECT project_id AS projectId,project_name AS projectName,project_status AS projectStatus,owner_id AS ownerId,owner_name AS ownerName,owner_mail AS ownerMail,contact_name AS contactName,contact_account AS contactAccount FROM project_showcase WHERE ${clauses.join(' AND ')} ORDER BY ${order},project_id LIMIT ?`, bind); }

  mutateProject(id: string, patch: Partial<ProjectRecord>): void { const ns = this.requireNamespace(); const project = rows<ProjectRecord>(this.requireDb(), 'SELECT id,name,owner_id AS ownerId,status,changed_at AS changedAt,deleted FROM projects WHERE namespace=? AND id=?', [ns, id])[0]; if (!project) throw new Error(`Project ${id} was not found.`); const next = { ...project, ...patch, changedAt: Date.now() }; this.transaction(() => { this.exec('UPDATE projects SET name=?,owner_id=?,status=?,changed_at=?,deleted=? WHERE namespace=? AND id=?', [next.name, next.ownerId, next.status, next.changedAt, next.deleted ? 1 : 0, ns, id]); this.exec('INSERT INTO sync_outbox(namespace,id,entity_type,entity_id,operation,payload,base_changed_at,state,created_at) VALUES(?,?,?,?,?,?,?,?,?)', [ns, `outbox-${id}-${next.changedAt}`, 'project', id, 'upsert', JSON.stringify(next), project.changedAt, 'pending', Date.now()]); }); }
  pendingOutbox(): Array<{ id: string; entityId: string; payload: ProjectRecord; baseChangedAt: number }> { return rows<{ id: string; entityId: string; payload: string; baseChangedAt: number }>(this.requireDb(), 'SELECT id,entity_id AS entityId,payload,base_changed_at AS baseChangedAt FROM sync_outbox WHERE namespace=? AND state IN (\'pending\',\'failed\') ORDER BY created_at', [this.requireNamespace()]).map(r => ({ ...r, payload: JSON.parse(r.payload) })); }
  markOutbox(id: string, state: string, attempts?: number): void { this.exec('UPDATE sync_outbox SET state=?,attempts=COALESCE(?,attempts) WHERE namespace=? AND id=?', [state, attempts === undefined ? null : attempts, this.requireNamespace(), id]); }
  addConflict(entityId: string, local: ProjectRecord, remote: ProjectRecord): void { this.exec('INSERT INTO sync_conflicts(namespace,id,entity_type,entity_id,local_payload,remote_payload,state,created_at) VALUES(?,?,?,?,?,?,?,?)', [this.requireNamespace(), `conflict-${entityId}-${Date.now()}`, 'project', entityId, JSON.stringify(local), JSON.stringify(remote), 'open', Date.now()]); }
  conflictCount(): number { return Number((rows<{ count: number }>(this.requireDb(), 'SELECT count(*) AS count FROM sync_conflicts WHERE namespace=? AND state=\'open\'', [this.requireNamespace()])[0] || { count: 0 }).count); }
  pendingCount(): number { return Number((rows<{ count: number }>(this.requireDb(), 'SELECT count(*) AS count FROM sync_outbox WHERE namespace=? AND state NOT IN (\'sent\')', [this.requireNamespace()])[0] || { count: 0 }).count); }
  dbBytes(): number | null { try { const pageCountRow = rows<{ value?: number; page_count?: number }>(this.requireDb(), 'PRAGMA page_count', [])[0] || {}; const pageSizeRow = rows<{ value?: number; page_size?: number }>(this.requireDb(), 'PRAGMA page_size', [])[0] || {}; const pageCount = Number(pageCountRow.value || pageCountRow.page_count || 0); const pageSize = Number(pageSizeRow.value || pageSizeRow.page_size || 0); return pageCount * pageSize; } catch { return null; } }
  clear(): void { const ns = this.requireNamespace(); this.transaction(() => { ['users', 'projects', 'crm_contacts', 'canonical_entities', 'source_identities', 'sync_sources', 'sync_outbox', 'sync_conflicts'].forEach(table => this.exec(`DELETE FROM ${table} WHERE namespace=?`, [ns])); this.exec('DELETE FROM runtime_metadata WHERE key=?', [`namespace:${ns}`]); }); }
  status(initialized = true): Status { return { initialized, storage: this.storage, sqliteVersion: this.module?.version.libVersion || 'uninitialized', namespace: this.namespace || null, online: typeof navigator === 'undefined' ? true : navigator.onLine, freshness: this.sourceStates(), pendingWrites: this.pendingCount(), conflicts: this.conflictCount(), dbBytes: this.dbBytes(), lastError: this.lastError }; }
  close(): void { this.db?.close(); this.db = undefined; }
}
