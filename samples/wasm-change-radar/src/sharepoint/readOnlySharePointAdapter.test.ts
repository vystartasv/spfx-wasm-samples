import { createSitePagesGetRequest, createUnavailableSharePointAdapter } from './readOnlySharePointAdapter';

describe('read-only SharePoint boundary', () => {
  test('describes only bounded same-site GET requests', () => {
    const request = createSitePagesGetRequest('https://contoso.example/sites/finance', 2);
    expect(request.method).toBe('GET');
    expect(request.pageSize).toBeLessThanOrEqual(80);
    expect(request.url).toContain('https://contoso.example/sites/finance/_api/web/');
    expect(() => createSitePagesGetRequest('https://contoso.example/sites/finance', 6)).toThrow();
    expect(() => createSitePagesGetRequest('https://contoso.example/sites/finance', 1)).not.toThrow();
  });

  test('tenant implementation is explicit and demo remains the verified path', async () => {
    const adapter = createUnavailableSharePointAdapter();
    const result = await adapter.loadPages('https://contoso.example/sites/finance', 80);
    expect(result.pages).toEqual([]);
    expect(result.warnings[0]).toContain('typed stub');
  });
});
