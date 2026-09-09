export const CONTRACT_VERSION = 1;

export interface Namespace {
  tenantId: string;
  userObjectId: string;
  applicationId: string;
}

export interface UserRecord { id: string; displayName: string; mail: string; department: string; changedAt: number; deleted?: boolean; }
export interface ProjectRecord { id: string; name: string; ownerId: string; status: string; changedAt: number; deleted?: boolean; }
export interface ContactRecord { id: string; name: string; email: string; account: string; changedAt: number; deleted?: boolean; }
export interface RelationshipRecord { sourceType: string; sourceId: string; targetType: string; targetId: string; relation: string; }
export type EntityRecord = UserRecord | ProjectRecord | ContactRecord;

export interface Page<T> { items: T[]; nextLink: string | null; deltaLink: string | null; }
export interface SourceState { source: string; nextLink: string | null; deltaLink: string | null; lastSyncedAt: number | null; }
export interface SyncCounters { requests: number; bytes: number; items: number; retries: number; }
export interface SyncReport { source: string; mode: 'bootstrap' | 'delta'; applied: number; deleted: number; counters: SyncCounters; cursor: string | null; }
export interface ShowcaseRow { projectId: string; projectName: string; projectStatus: string; ownerId: string; ownerName: string; ownerMail: string; contactName: string | null; contactAccount: string | null; }
export interface QueryOptions { text?: string; status?: string; sort?: 'name' | 'owner'; limit?: number; }
export interface Status { initialized: boolean; storage: 'opfs' | 'memory'; sqliteVersion: string; namespace: Namespace | null; online: boolean; freshness: SourceState[]; pendingWrites: number; conflicts: number; dbBytes: number | null; lastError: string | null; }

export type AdapterName = 'sharepoint' | 'graph' | 'enterprise';
export interface Adapter<T> {
  bootstrap(cursor: string | null): Promise<Page<T>>;
  delta(cursor: string | null): Promise<Page<T>>;
  write(record: T, expectedChangedAt: number | null): Promise<{ record: T } | { conflict: true; remote: T }>;
}

export interface RpcRequest {
  version: typeof CONTRACT_VERSION;
  id: string;
  method: 'init' | 'hydrate' | 'sync' | 'query-showcase' | 'status' | 'mutate-optimistic-project' | 'flush-outbox' | 'simulate-conflict' | 'clear-data';
  payload?: unknown;
}
export interface RpcResponse {
  version: typeof CONTRACT_VERSION;
  id: string;
  ok: boolean;
  result?: unknown;
  error?: { code: string; message: string; retryable: boolean; details?: unknown };
}
