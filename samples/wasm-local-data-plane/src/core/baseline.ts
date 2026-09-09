import { buildFixture, FixtureData, queryFixture } from './fixtures';
import { QueryOptions, ShowcaseRow } from './types';

export interface BaselineResult { rows: ShowcaseRow[]; durationMs: number; networkRequests: number; networkBytes: number; }
export function queryMemory(fixture: FixtureData, options: QueryOptions): ShowcaseRow[] { return queryFixture(fixture, options); }
let cachedFixture: FixtureData | undefined;
const defaultFixture = (): FixtureData => cachedFixture || (cachedFixture = buildFixture());
export function runBaseline(options: QueryOptions = {}, fixture = defaultFixture()): BaselineResult {
  const started = performance.now();
  const rows = queryMemory(fixture, options);
  return { rows, durationMs: performance.now() - started, networkRequests: 0, networkBytes: 0 };
}
