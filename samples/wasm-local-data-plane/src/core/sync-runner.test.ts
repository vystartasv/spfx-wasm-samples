import { syncSource } from './sync-runner';
import { Adapter, UserRecord } from './types';
import { SqliteStore } from './sqlite-store';

Object.assign(globalThis, { TextEncoder: class { encode(value: string): { byteLength: number } { return { byteLength: encodeURIComponent(value).replace(/%[0-9A-F]{2}/g, 'x').length }; } } });

describe('sync page commits', () => {
  test('reports the newest committed cursor after paging', async () => {
    const pages = [
      { items: [{ id: 'user-1', displayName: 'One', mail: 'one@test', department: 'Test', changedAt: 1 }], nextLink: 'https://example.test/users?page=2&x=%2F', deltaLink: 'https://example.test/users/delta?token=old' },
      { items: [{ id: 'user-2', displayName: 'Two', mail: 'two@test', department: 'Test', changedAt: 2 }], nextLink: null, deltaLink: 'https://example.test/users/delta?token=new&x=%2F' }
    ];
    const calls: Array<{ nextLink: string | null; deltaLink: string | null }> = [];
    const store = { applySyncPage: (_source: string, _kind: string, _items: UserRecord[], nextLink: string | null, deltaLink: string | null) => calls.push({ nextLink, deltaLink }) } as unknown as SqliteStore;
    const adapter = { bootstrap: async (cursor: string | null) => pages[cursor ? 1 : 0], delta: async () => pages[1], write: async (record: UserRecord) => ({ record }) } as Adapter<UserRecord>;

    const report = await syncSource('users', adapter, store, undefined, 'users', true);

    expect(calls).toEqual(pages.map(({ nextLink, deltaLink }) => ({ nextLink, deltaLink })));
    expect(report.cursor).toBe(pages[1].deltaLink);
  });

  test('malformed records reject through syncSource without advancing the cursor', async () => {
    const calls: Array<{ nextLink: string | null; deltaLink: string | null }> = [];
    const store = { applySyncPage: (_source: string, _kind: string, _items: UserRecord[], nextLink: string | null, deltaLink: string | null) => calls.push({ nextLink, deltaLink }) } as unknown as SqliteStore;
    const adapter = { bootstrap: async () => ({ items: [{ id: 'user-1', displayName: 'One', mail: 'one@test', department: 'Test', changedAt: 1, deleted: 'no' }], nextLink: 'bad-next', deltaLink: 'bad-delta' }), delta: async () => ({ items: [], nextLink: null, deltaLink: null }), write: async (record: UserRecord) => ({ record }) } as unknown as Adapter<UserRecord>;
    await expect(syncSource('users', adapter, store, undefined, 'users', true)).rejects.toMatchObject({ code: 'MALFORMED_RECORD' });
    expect(calls).toEqual([]);
  });
});
