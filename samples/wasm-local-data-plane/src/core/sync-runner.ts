import { Adapter, ContactRecord, ProjectRecord, SourceState, SyncReport, UserRecord } from './types';
import { classifyFailure } from './sync-contract';
import { SqliteStore } from './sqlite-store';

function validRecord(record: unknown): boolean { return !!record && typeof record === 'object' && typeof (record as { id?: unknown }).id === 'string' && typeof (record as { changedAt?: unknown }).changedAt === 'number'; }

export async function syncSource<T>(source: string, adapter: Adapter<T>, store: SqliteStore, state: SourceState | undefined, kind: 'users' | 'projects' | 'contacts', forceBootstrap = false): Promise<SyncReport> {
  const mode = !forceBootstrap && state?.deltaLink ? 'delta' : 'bootstrap';
  let cursor = mode === 'delta' ? state?.deltaLink || null : state?.nextLink || null;
  let applied = 0;
  let deleted = 0;
  let committedCursor = state?.deltaLink || null;
  const counters = { requests: 0, bytes: 0, items: 0, retries: 0 };
  try {
    do {
      const page = mode === 'delta' && !cursor ? await adapter.delta(null) : mode === 'delta' ? await adapter.delta(cursor) : await adapter.bootstrap(cursor);
      counters.requests += 1;
      counters.items += page.items.length;
      counters.bytes += new TextEncoder().encode(JSON.stringify(page.items)).byteLength;
      page.items.forEach(item => { if (!validRecord(item)) throw Object.assign(new Error('Adapter returned a malformed record.'), { code: 'MALFORMED_RECORD' }); const record = item as T & { deleted?: boolean }; if (record.deleted) deleted += 1; else applied += 1; });
      cursor = page.nextLink;
      store.applySyncPage(source, kind, page.items as unknown as UserRecord[], cursor, page.deltaLink);
      committedCursor = cursor || page.deltaLink || committedCursor;
    } while (cursor);
    return { source, mode, applied, deleted, counters, cursor: committedCursor };
  } catch (error) {
    const classified = classifyFailure(error as { status?: number; code?: string; message?: string });
    if (classified.retryable) counters.retries += 1;
    throw Object.assign(new Error(classified.message), classified);
  }
}

export async function hydrateAll(store: SqliteStore, adapters: { users: Adapter<UserRecord>; projects: Adapter<ProjectRecord>; contacts: Adapter<ContactRecord> }): Promise<SyncReport[]> {
  return [
    await syncSource('graph-users', adapters.users, store, undefined, 'users', true),
    await syncSource('sharepoint-projects', adapters.projects, store, undefined, 'projects', true),
    await syncSource('crm-contacts', adapters.contacts, store, undefined, 'contacts', true)
  ];
}
