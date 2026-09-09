import { namespaceFilename, SqliteStore } from './sqlite-store';

describe('sync page atomicity', () => {
  test('namespace filenames use the full collision-resistant digest', async () => {
    const subtle = { digest: async (_algorithm: string, data: Uint8Array) => Uint8Array.from({ length: 32 }, () => data.reduce((sum, value) => sum + value, 0) % 256) } as unknown as SubtleCrypto;
    Object.assign(globalThis, { TextEncoder: class { encode(value: string): Uint8Array { return Uint8Array.from(Array.prototype.map.call(value, (character: string) => character.charCodeAt(0))); } } });
    const first = await namespaceFilename({ tenantId: 'tenant', userObjectId: 'user-a', applicationId: 'app' }, subtle);
    const second = await namespaceFilename({ tenantId: 'tenant', userObjectId: 'user-b', applicationId: 'app' }, subtle);
    expect(first).toHaveLength(64);
    expect(second).toHaveLength(64);
    expect(first).not.toBe(second);
  });
  test('rolls back records and cursor together when a page fails', () => {
    const statements: string[] = [];
    const store = new SqliteStore() as unknown as { db: { exec: (config: { sql: string }) => void }; namespace: { tenantId: string; userObjectId: string; applicationId: string } };
    store.namespace = { tenantId: 'tenant', userObjectId: 'user', applicationId: 'app' };
    store.db = { exec: ({ sql }) => { statements.push(sql); if (sql.startsWith('INSERT INTO users')) throw new Error('write failed'); } };

    expect(() => (store as unknown as SqliteStore).applySyncPage('users', 'users', [{ id: 'user-1', displayName: 'One', mail: 'one@test', department: 'Test', changedAt: 1 }], 'https://example.test/next', 'https://example.test/delta')).toThrow('write failed');
    expect(statements).toEqual(['BEGIN', expect.stringMatching(/^INSERT INTO users/), 'ROLLBACK']);
  });
});
