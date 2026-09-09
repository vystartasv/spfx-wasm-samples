import { buildFixture, queryFixture } from './fixtures';
import { queryMemory, runBaseline } from './baseline';
import { resolveContact } from './identity';

describe('baseline/local parity contract', () => {
  test('same fixture and query produce same rows', () => {
    const fixture = buildFixture({ users: 20, projects: 20, contacts: 10, relationships: 20 });
    expect(queryMemory(fixture, { status: 'Active', sort: 'name', limit: 10 })).toEqual(queryFixture(fixture, { status: 'Active', sort: 'name', limit: 10 }));
  });

  test('baseline reuses the supplied fixture', () => {
    const fixture = buildFixture({ users: 1, projects: 1, contacts: 1, relationships: 0 });
    expect(runBaseline({ limit: 1 }, fixture).rows).toEqual(queryFixture(fixture, { limit: 1 }));
  });

  test('identity join normalizes email without treating it as a security decision', () => {
    const fixture = buildFixture({ users: 1, projects: 1, contacts: 1, relationships: 0 });
    fixture.contacts[0].email = ` ${fixture.users[0].mail.toUpperCase()} `;
    expect(resolveContact(fixture.users[0], fixture.contacts)?.id).toBe('contact-00001');
  });
});
