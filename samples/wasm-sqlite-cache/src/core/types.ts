export const CONTRACT_VERSION = 1;
export interface Namespace { tenantId: string; userObjectId: string; applicationId: string; }
export interface CacheItem { id: string; title: string; category: 'Red' | 'Blue' | 'Green'; amount: number; updatedAt: number; deleted?: boolean; }
export interface QueryOptions { text?: string; category?: CacheItem['category'] | ''; sort?: 'title' | 'amount'; }
export type OutboxState = 'pending' | 'sending' | 'sent' | 'failed' | 'conflict';
export interface OutboxEntry { id: string; itemId: string; operation: 'create' | 'update' | 'delete'; payload: CacheItem; state: OutboxState; error?: string; }
export interface Conflict { itemId: string; local: CacheItem; remote: CacheItem; }
export interface Status { initialized: boolean; storage: 'opfs' | 'memory'; sqliteVersion: string; namespace: Namespace | null; itemCount: number; pending: number; failed: number; conflicts: number; lastSync: string | null; error: string | null; warning: string | null; }
export interface SyncResult { state: 'sent' | 'failed' | 'conflict'; processed: number; message: string; }
export interface RpcResponse { version: number; id: string; ok: boolean; result?: unknown; error?: { code: string; message: string; retryable: boolean }; }
export function isValidRpcRequest(value: unknown): value is { version: number; id: string; method: string; payload?: unknown } { if (!value || typeof value !== 'object') return false; const request = value as { version?: unknown; id?: unknown; method?: string; payload?: unknown }; return request.version === CONTRACT_VERSION && typeof request.id === 'string' && typeof request.method === 'string' && ['init', 'status', 'hydrate', 'query', 'add', 'update', 'delete', 'sync', 'clear'].indexOf(request.method) >= 0 && (request.payload === undefined || (!!request.payload && typeof request.payload === 'object')); }
