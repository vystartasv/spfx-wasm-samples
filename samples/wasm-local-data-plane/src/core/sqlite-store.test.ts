import { SqliteStore } from './sqlite-store';

describe('sync page atomicity', () => {
  test('rolls back records and cursor together when a page fails', () => {
    const statements: string[] = [];
    const store = new SqliteStore() as unknown as { db: { exec: (config: { sql: string }) => void }; namespace: { tenantId: string; userObjectId: string; applicationId: string } };
    store.namespace = { tenantId: 'tenant', userObjectId: 'user', applicationId: 'app' };
    store.db = { exec: ({ sql }) => { statements.push(sql); if (sql.startsWith('INSERT INTO users')) throw new Error('write failed'); } };

    expect(() => (store as unknown as SqliteStore).applySyncPage('users', 'users', [{ id: 'user-1', displayName: 'One', mail: 'one@test', department: 'Test', changedAt: 1 }], 'https://example.test/next', 'https://example.test/delta')).toThrow('write failed');
    expect(statements).toEqual(['BEGIN', expect.stringMatching(/^INSERT INTO users/), 'ROLLBACK']);
  });
});
