import { sharePointUploadUrl } from './uploadUrl';
describe('SharePoint upload URL', () => {
  test.each(['file name.jpg', "a'b#?&%.jpg"])('encodes filename %s', name => expect(sharePointUploadUrl('https://tenant.example/sites/demo', '/sites/demo/Site Assets', name, 'https://tenant.example')).toContain(encodeURIComponent(name.replace(/'/g, "''"))));
  test.each(['javascript:alert(1)', 'https://user:pass@tenant.example/sites/demo', 'https://tenant.example/sites/demo?x=1', 'https://other.example/sites/demo', 'https://tenant.example/sites/demo#x', 'https://tenant.example/sites/demo\n'])('rejects unsafe site URL %s', url => expect(() => sharePointUploadUrl(url, '/sites/demo/SiteAssets', 'x.jpg', 'https://tenant.example')).toThrow());
});
