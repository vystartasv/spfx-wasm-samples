import { Aggregate, aggregateRows, AGGREGATION_SQL, AnalyticsRow } from './fixture';

export const duckdbAggregationQuery = (): string => AGGREGATION_SQL;
export function isValidAnalyticsRequest(value: unknown): value is { id: number; method: 'load' | 'run' | 'clear' } { return !!value && typeof value === 'object' && typeof (value as { id?: unknown }).id === 'number' && ['load', 'run', 'clear'].indexOf((value as { method?: string }).method || '') >= 0; }

export interface MeasuredResult { engine: 'native' | 'duckdb'; durationMs: number; inputRows: number; groups: Aggregate[]; query?: string; status: 'ok' | 'error'; error?: string; }
export function shapeResult(engine: MeasuredResult['engine'], startedAt: number, inputRows: number, groups: Aggregate[], query?: string): MeasuredResult { return { engine, durationMs: performance.now() - startedAt, inputRows, groups, query, status: 'ok' }; }
export function nativeAggregation(rows: Iterable<AnalyticsRow>, inputRows: number): MeasuredResult { const startedAt = performance.now(); return shapeResult('native', startedAt, inputRows, aggregateRows(rows)); }
export function failure(engine: 'native' | 'duckdb', error: unknown, inputRows: number, query?: string): MeasuredResult { return { engine, durationMs: 0, inputRows, groups: [], query, status: 'error', error: error instanceof Error ? error.message : String(error) }; }

export function shapeDuckdbRows(rows: Array<Record<string, unknown>>): Aggregate[] { return rows.map(row => ({ category: String(row.category), totalAmount: Number(row.total_amount), totalQuantity: Number(row.total_quantity), rowCount: Number(row.row_count) })); }
