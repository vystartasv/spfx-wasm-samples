export const CONTRACT_VERSION = 1;
export interface Namespace { tenantId: string; userObjectId: string; applicationId: string; }
export interface CacheItem { id: string; title: string; category: 'Red' | 'Blue' | 'Green'; amount: number; updatedAt: number; deleted?: boolean; }
export interface QueryOptions { text?: string; category?: CacheItem['category'] | ''; sort?: 'title' | 'amount'; }
export type OutboxState = 'pending' | 'sending' | 'sent' | 'failed' | 'conflict';
export interface OutboxEntry { id: string; itemId: string; operation: 'create' | 'update' | 'delete'; payload: CacheItem; state: OutboxState; error?: string; }
export interface Conflict { itemId: string; local: CacheItem; remote: CacheItem; }
export interface Status { initialized: boolean; storage: 'opfs' | 'memory'; sqliteVersion: string; namespace: Namespace | null; itemCount: number; pending: number; failed: number; conflicts: number; lastSync: string | null; error: string | null; warning: string | null; }
export interface SyncResult { state: 'sent' | 'failed' | 'conflict'; processed: number; message: string; }
export const CATEGORIES: CacheItem['category'][] = ['Red', 'Blue', 'Green'];
export function validAmount(value: unknown): value is number { return typeof value === 'number' && Number.isFinite(value); }
export function validateMutationPayload(method: string, payload: unknown): void {
  if (!payload || typeof payload !== 'object') throw new Error('A mutation payload is required.');
  const value = payload as Record<string, unknown>;
  if (method === 'add') { if (typeof value.title !== 'string' || !value.title.trim() || typeof value.category !== 'string' || CATEGORIES.indexOf(value.category as CacheItem['category']) < 0 || !validAmount(value.amount)) throw new Error('Add requires a title, allowed category, and finite amount.'); return; }
  if (method === 'update') { if (typeof value.id !== 'string' || !value.id) throw new Error('Update requires an item id.'); const patch = value.patch; if (!patch || typeof patch !== 'object' || Object.keys(patch as object).some(key => ['title', 'category', 'amount'].indexOf(key) < 0)) throw new Error('Update patch contains an immutable or unknown field.'); const next = patch as Record<string, unknown>; if ('title' in next && (typeof next.title !== 'string' || !next.title.trim()) || 'category' in next && (typeof next.category !== 'string' || CATEGORIES.indexOf(next.category as CacheItem['category']) < 0) || 'amount' in next && !validAmount(next.amount)) throw new Error('Update patch contains an invalid field.'); return; }
  if (method === 'delete' && (typeof value.id !== 'string' || !value.id)) throw new Error('Delete requires an item id.');
}
export interface RpcResponse { version: number; id: string; ok: boolean; result?: unknown; error?: { code: string; message: string; retryable: boolean }; }
export function isValidRpcRequest(value: unknown): value is { version: number; id: string; method: string; payload?: unknown } { if (!value || typeof value !== 'object') return false; const request = value as { version?: unknown; id?: unknown; method?: string; payload?: unknown }; return request.version === CONTRACT_VERSION && typeof request.id === 'string' && typeof request.method === 'string' && ['init', 'status', 'hydrate', 'query', 'add', 'update', 'delete', 'sync', 'clear'].indexOf(request.method) >= 0 && (request.payload === undefined || (!!request.payload && typeof request.payload === 'object')); }
