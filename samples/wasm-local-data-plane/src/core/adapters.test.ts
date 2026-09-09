import { MockGraphUsersAdapter, MockEnterpriseAdapter, MockSharePointListAdapter } from './adapters';

describe('deterministic adapters', () => {
  test('pages bootstrap with opaque full-url cursors and emits delta', async () => {
    const adapter = new MockGraphUsersAdapter({ pageSize: 7 });
    const first = await adapter.bootstrap(null);
    expect(first.items).toHaveLength(7);
    expect(first.nextLink).toMatch(/^https:\/\/mock\.graph\/users\?/);
    const second = await adapter.bootstrap(first.nextLink);
    expect(second.items[0].id).toBe('user-00008');
    expect(await adapter.delta(first.deltaLink)).toMatchObject({ items: [] });
  });

  test('sharepoint fixture has 10000 projects and enterprise writes detect conflicts', async () => {
    const projects = new MockSharePointListAdapter({ pageSize: 10000 });
    expect((await projects.bootstrap(null)).items).toHaveLength(10000);
    const enterprise = new MockEnterpriseAdapter();
    const remote = await enterprise.write({ id: 'project-00001', name: 'Remote', ownerId: 'user-00001', status: 'Done', changedAt: 9 }, 1);
    expect('record' in remote).toBe(true);
    expect((await enterprise.delta('https://mock.enterprise/projects/delta?changedSince=1&token=opaque-1')).items[0].name).toBe('Remote');
    const conflict = await enterprise.write({ id: 'project-00001', name: 'Local', ownerId: 'user-00001', status: 'Active', changedAt: 10 }, 1);
    expect(conflict).toMatchObject({ conflict: true });
  });

  test('malformed records fail at the sync boundary', async () => {
    await expect(new MockGraphUsersAdapter({ pageSize: 1, failure: 'malformed-record' }).bootstrap(null)).resolves.toMatchObject({ items: [{ id: 'user-00001' }, { invalid: true }] });
  });
});
