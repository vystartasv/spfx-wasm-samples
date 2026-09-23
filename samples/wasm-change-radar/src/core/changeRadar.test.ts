import { analyzePages, exportReport, extractReferences, fixturePages, isRpcRequest, isRpcResponse, stableHash, stableJson, validateAnalysisInput, validateSameSiteUrl } from './changeRadar';

describe('change radar graph oracle', () => {
  const siteUrl = 'https://contoso.example/sites/demo';

  test('normalizes same-site URLs while preserving managed paths', () => {
    expect(validateSameSiteUrl(siteUrl, '/sites/demo/SitePages/Legacy.aspx?view=1#top').normalized).toBe(`${siteUrl}/SitePages/Legacy.aspx`);
    expect(validateSameSiteUrl(siteUrl, 'https://contoso.example/other/SitePages/Legacy.aspx').valid).toBe(false);
    expect(validateSameSiteUrl(siteUrl, 'https://other.example/sites/demo/SitePages/Legacy.aspx').external).toBe(true);
  });

  test('extracts escaped and malformed href references without interpreting markup', () => {
    const refs = extractReferences('<a href=&quot;/sites/demo/SitePages/Legacy.aspx&quot;>escaped</a><a href="/sites/demo/SitePages/Missing.aspx">open', siteUrl);
    expect(refs.map(ref => ref.raw)).toEqual(['/sites/demo/SitePages/Legacy.aspx', '/sites/demo/SitePages/Missing.aspx']);
    expect(refs[0].context).toContain('escaped');
  });

  test('finds direct, indirect, cyclic, missing, external, duplicate, and warning evidence', () => {
    const result = analyzePages({ scope: 'demo', siteUrl, targetUrl: '/sites/demo/SitePages/Legacy.aspx', action: 'retire' });
    expect(result.source).toBe('Demo fixture');
    expect(result.summary.direct).toBeGreaterThan(0);
    expect(result.summary.indirect).toBeGreaterThan(0);
    expect(result.summary.cycles).toBeGreaterThan(0);
    expect(result.summary.missing).toBeGreaterThan(0);
    expect(result.summary.external).toBeGreaterThan(0);
    expect(result.warnings.join(' ')).toContain('Duplicate canonical URL');
    expect(result.impacts.map(item => item.url)).toEqual([...result.impacts].sort((a, b) => a.distance - b.distance || a.url.localeCompare(b.url)).map(item => item.url));
    expect(result.impacts.find(item => item.title === 'Cycle A')?.cycle).toBe(true);
  });

  test('bounds and validates the worker input contract', () => {
    expect(validateAnalysisInput({ scope: 'demo', siteUrl, targetUrl: '/sites/demo/SitePages/Legacy.aspx', action: 'move' }).join(' ')).toContain('replacement');
    expect(validateAnalysisInput({ scope: 'demo', siteUrl, targetUrl: 'https://other.example/x', action: 'retire' }).join(' ')).toContain('managed path');
    expect(() => analyzePages({ scope: 'demo', siteUrl, targetUrl: '/sites/demo/SitePages/Legacy.aspx', action: 'retire' }, () => true)).toThrow('cancelled');
    expect(isRpcRequest({ version: 1, id: 'scan-1', method: 'analyze', payload: { scope: 'demo', siteUrl, targetUrl: '/sites/demo/SitePages/Legacy.aspx', action: 'retire' } })).toBe(true);
    expect(isRpcRequest({ version: 2, id: 'scan-1', method: 'analyze', payload: {} })).toBe(false);
    expect(isRpcResponse({ version: 1, id: 'scan-1', ok: false, error: { code: 'CANCELLED', message: 'cancelled' } })).toBe(true);
    expect(isRpcResponse({ version: 1, id: 'scan-1', ok: true })).toBe(false);
  });

  test('fixture and export hash are stable', () => {
    const first = fixturePages(siteUrl); const second = fixturePages(siteUrl);
    expect(stableJson(first)).toBe(stableJson(second));
    const result = analyzePages({ scope: 'demo', siteUrl, targetUrl: '/sites/demo/SitePages/Legacy.aspx', action: 'replace', replacementUrl: '/sites/demo/SitePages/Current.aspx' });
    expect(exportReport(result)).toBe(exportReport({ ...result, durationMs: 99 }));
    expect(stableHash(result)).toBe(stableHash({ ...result }));
  });
});
