import { MAX_PAGE_REQUESTS, MAX_PAGES, PageRecord, validateSameSiteUrl } from '../core/changeRadar';

export interface ReadOnlyPageRequest {
  method: 'GET';
  url: string;
  pageSize: number;
  pageRequest: number;
}

export interface ReadOnlyPageResult {
  pages: PageRecord[];
  warnings: string[];
}

export interface ReadOnlySharePointAdapter {
  readonly mode: 'current-site';
  loadPages(siteUrl: string, pageLimit: number): Promise<ReadOnlyPageResult>;
}

export function createSitePagesGetRequest(siteUrl: string, pageRequest = 1): ReadOnlyPageRequest {
  const normalized = validateSameSiteUrl(siteUrl, siteUrl);
  if (!normalized.valid || !normalized.normalized) throw new Error('The current-site adapter requires a valid same-site URL.');
  if (!Number.isInteger(pageRequest) || pageRequest < 1 || pageRequest > MAX_PAGE_REQUESTS) throw new Error(`Page request must be between 1 and ${MAX_PAGE_REQUESTS}.`);
  return {
    method: 'GET',
    url: `${normalized.normalized}/_api/web/lists/getbytitle('Site Pages')/items?$select=FileRef,Title,CanvasContent1&$top=${Math.min(MAX_PAGES, 20)}`,
    pageSize: Math.min(MAX_PAGES, 20),
    pageRequest
  };
}

/**
 * Typed integration boundary only. A tenant implementation may issue the returned GET request
 * through SPHttpClient after permissions, throttling, and list-shape behavior are validated.
 */
export function createUnavailableSharePointAdapter(): ReadOnlySharePointAdapter {
  return {
    mode: 'current-site',
    async loadPages(): Promise<ReadOnlyPageResult> {
      return { pages: [], warnings: ['Current-site GET adapter is a typed stub in this sample; demo fixture mode is the verified path.'] };
    }
  };
}
