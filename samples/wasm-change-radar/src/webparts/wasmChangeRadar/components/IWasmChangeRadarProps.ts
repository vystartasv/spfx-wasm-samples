import type { ReadOnlyPageResult } from '../../../sharepoint/readOnlySharePointAdapter';

export interface IWasmChangeRadarProps {
  description?: string;
  siteUrl: string;
  readCurrentSitePages: (siteUrl: string, pageLimit: number) => Promise<ReadOnlyPageResult>;
}
