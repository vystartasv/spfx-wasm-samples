export interface ReplayValue { id: string; changedAt: number; deleted?: boolean; [key: string]: unknown; }
export interface Failure { status?: number; code?: string; message?: string; }
export const MAX_GRAPH_BATCH_REQUESTS = 20;
export function graphBatches<T>(requests: T[]): T[][] { const batches: T[][] = []; for (let index = 0; index < requests.length; index += MAX_GRAPH_BATCH_REQUESTS) batches.push(requests.slice(index, index + MAX_GRAPH_BATCH_REQUESTS)); return batches; }

export function opaqueCursor(cursor: string | null): string | null { return cursor; }
export function cursorAfterPage(previous: string | null, next: string | null, dataCommitted: boolean): string | null { return dataCommitted ? next : previous; }

export function replayState<T extends ReplayValue>(current: T | undefined, incoming: T): T {
  if (!current || incoming.changedAt > current.changedAt || (incoming.changedAt === current.changedAt && incoming.deleted && !current.deleted)) return { ...incoming };
  return current;
}

export function classifyFailure(failure: Failure): { code: string; retryable: boolean; message: string } {
  if (failure.status === 410) return { code: 'CURSOR_EXPIRED', retryable: false, message: 'Remote cursor expired; bootstrap is required.' };
  if (failure.status === 429 || failure.status === 503) return { code: 'THROTTLED', retryable: true, message: 'Remote service asked this request to be retried.' };
  if (failure.code === 'OFFLINE') return { code: 'OFFLINE', retryable: true, message: 'The browser is offline.' };
  if (failure.code === 'MALFORMED_RECORD') return { code: 'MALFORMED_RECORD', retryable: false, message: 'The adapter returned a malformed record.' };
  return { code: failure.code || 'SYNC_FAILED', retryable: false, message: failure.message || 'Synchronization failed.' };
}
