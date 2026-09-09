import { fixture } from './fixtures';
import { MemoryStore } from './memory-store';
import { applyMigrations, MIGRATIONS } from './schema';
import type { Namespace } from './types';

const namespace = (userObjectId: string): Namespace => ({ tenantId: 'tenant-a', userObjectId, applicationId: 'sqlite-cache-test' });

describe('SQLite cache contracts', () => {
  test('schema migrations are ordered and transactional', () => { const statements: string[] = []; applyMigrations({ exec: ({ sql }) => { statements.push(sql); return undefined; } }, 123); expect(statements[0]).toBe('BEGIN'); expect(statements).toContain('COMMIT'); expect(statements.filter(x => x.startsWith('INSERT OR IGNORE'))).toHaveLength(MIGRATIONS.length); });
  test('deterministic fixture and CRUD produce local outbox state', () => { expect(fixture()).toEqual(fixture()); const store = new MemoryStore(namespace('user-a')); store.hydrate(); expect(store.query()).toHaveLength(5); store.update('item-001', { title: 'Changed' }); store.remove('item-002'); store.add('New item', 'Red', 9); expect(store.query()).toHaveLength(5); expect(store.status().pending).toBe(3); });
  test('search, filter, and sort are deterministic', () => { const store = new MemoryStore(namespace('user-a')); store.hydrate(); expect(store.query({ text: 'launch' }).map(x => x.id)).toEqual(['item-002']); expect(store.query({ category: 'Blue', sort: 'amount' }).map(x => x.id)).toEqual(['item-001', 'item-004']); });
  test('namespace isolation is explicit', () => { const one = new MemoryStore(namespace('user-a')); const two = new MemoryStore(namespace('user-b')); one.hydrate(); expect(two.query()).toEqual([]); expect(one.status().namespace?.userObjectId).toBe('user-a'); });
  test('failure and conflict retain explicit state', () => { const store = new MemoryStore(namespace('user-a')); store.hydrate(); store.update('item-001', { title: 'Local' }); expect(store.sync('failure').state).toBe('failed'); expect(store.status().failed).toBe(1); expect(store.sync('conflict').state).toBe('conflict'); expect(store.status().conflicts).toBe(1); expect(store.sync('success').state).toBe('sent'); });
  test('fallback status shapes warning and memory mode', () => { const status = new MemoryStore(namespace('user-a'), 'SQLite failed').status(); expect(status.storage).toBe('memory'); expect(status.warning).toBe('SQLite failed'); expect(status.sqliteVersion).toBe('fallback'); });
});
