const hasControlChars = (value: string): boolean => Array.from(value).some(character => character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127);

export function sharePointUploadUrl(pageUrl: string, folder: string, filename: string, locationOrigin?: string): string {
  if (typeof pageUrl !== 'string' || hasControlChars(pageUrl)) throw new Error('SharePoint site URL is invalid.');
  const site = new URL(pageUrl);
  if (['http:', 'https:'].indexOf(site.protocol) < 0 || site.username || site.password || site.search || site.hash) throw new Error('SharePoint site URL is invalid.');
  const origin = locationOrigin || (typeof window !== 'undefined' ? window.location.origin : undefined);
  if (origin && site.origin !== origin) throw new Error('SharePoint site URL must use the current page origin.');
  const encodeOData = (value: string): string => encodeURIComponent(value.replace(/'/g, "''"));
  return `${site.origin}${site.pathname.replace(/\/$/, '')}/_api/web/GetFolderByServerRelativeUrl('${encodeOData(folder)}')/Files/add(overwrite=true,url='${encodeOData(filename)}')`;
}
