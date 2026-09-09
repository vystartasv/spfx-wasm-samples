import { applyMigrations, MIGRATIONS } from './schema';
import { isValidRpcRequest } from './types';
import { classifyFailure, cursorAfterPage, graphBatches, MAX_GRAPH_BATCH_REQUESTS, opaqueCursor, replayState } from './sync-contract';

describe('local data-plane contracts', () => {
  test('schema contains isolated required tables, indexes, and showcase views', () => {
    const schema = MIGRATIONS.join('\n');
    ['users', 'projects', 'crm_contacts', 'canonical_entities', 'source_identities', 'sync_sources', 'sync_outbox', 'sync_conflicts', 'person_360', 'project_showcase', 'namespace'].forEach(name => expect(schema).toContain(name));
    expect(schema).toContain('projects_owner_idx');
  });

  test('migrations are transactional and idempotent', () => {
    const calls: string[] = [];
    applyMigrations({ exec: ({ sql }) => calls.push(sql) }, 123);
    expect(calls[0]).toBe('BEGIN');
    expect(calls[calls.length - 1]).toBe('COMMIT');
    expect(calls.filter(sql => sql.startsWith('INSERT OR IGNORE')).length).toBe(MIGRATIONS.length);
  });

  test('opaque cursors are persisted as exact strings', () => {
    const cursor = 'https://graph.example/v1.0/users?$skiptoken=eyJvZmZzZXQiOjIwfQ%3D%3D&x=%2F';
    expect(opaqueCursor(cursor)).toBe(cursor);
  });

  test('interrupted page retains its cursor; committed page advances it, and Graph batches cap at 20', () => {
    const next = 'https://graph.example/$batch?token=opaque-next';
    expect(cursorAfterPage('old', next, false)).toBe('old');
    expect(cursorAfterPage('old', next, true)).toBe(next);
    expect(MAX_GRAPH_BATCH_REQUESTS).toBe(20);
    expect(graphBatches(Array.from({ length: 41 }, (_, index) => index)).map(batch => batch.length)).toEqual([20, 20, 1]);
  });

  test('replay is idempotent and deletion wins', () => {
    const first = replayState(undefined, { id: '1', changedAt: 2, deleted: false });
    const duplicate = replayState(first, { id: '1', changedAt: 2, deleted: false });
    const deletion = replayState(duplicate, { id: '1', changedAt: 3, deleted: true } as { id: string; changedAt: number; deleted: boolean });
    expect(duplicate).toEqual(first);
    expect(deletion?.deleted).toBe(true);
    expect(replayState(deletion, { id: '1', changedAt: 2, deleted: false })).toEqual(deletion);
  });

  test('failure classification distinguishes expired cursor, malformed data, offline, and throttling', () => {
    expect(classifyFailure({ status: 410 })).toMatchObject({ code: 'CURSOR_EXPIRED', retryable: false });
    expect(classifyFailure({ code: 'MALFORMED_RECORD' })).toMatchObject({ code: 'MALFORMED_RECORD', retryable: false });
    expect(classifyFailure({ code: 'OFFLINE' })).toMatchObject({ code: 'OFFLINE', retryable: true });
    expect(classifyFailure({ status: 429 })).toMatchObject({ code: 'THROTTLED', retryable: true });
  });
  test.each([null, 1, {}, { version: 2, id: 'x', method: 'status' }, { version: 1, method: 'status' }, { version: 1, id: 'x', method: 'unknown' }, { version: 1, id: 'x', method: 'sync', payload: 1 }])('rejects malformed data-plane RPC requests: %p', request => expect(isValidRpcRequest(request)).toBe(false));
});
