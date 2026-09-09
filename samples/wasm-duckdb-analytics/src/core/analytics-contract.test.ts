import { duckdbAggregationQuery, failure, isValidAnalyticsRequest, shapeDuckdbRows, shapeResult } from './analytics';
import { aggregateRows, fixtureRows } from './fixture';
describe('result shaping', () => {
  test('production worker query contract is available to the worker', () => expect(duckdbAggregationQuery()).toContain('GROUP BY category'));
  test('preserves measured fields and failure state', () => {
    expect(shapeResult('duckdb', performance.now() - 2, 10, [], 'SELECT 1')).toMatchObject({ engine: 'duckdb', inputRows: 10, query: 'SELECT 1', status: 'ok' });
    expect(failure('duckdb', new Error('WASM unavailable'), 10, 'SELECT 1')).toMatchObject({ engine: 'duckdb', inputRows: 10, query: 'SELECT 1', status: 'error', error: 'WASM unavailable' });
  });

  test('DuckDB result shape has baseline parity', () => {
    const baseline = aggregateRows(fixtureRows(20));
    const duckdbShape = shapeDuckdbRows(baseline.map(row => ({ category: row.category, total_amount: row.totalAmount, total_quantity: row.totalQuantity, row_count: row.rowCount })));
    expect(duckdbShape).toEqual(baseline);
  });
  test.each([null, 1, { id: 1, method: 'unknown' }, { id: 1 }, { id: '1', method: 'load' }])('rejects malformed worker requests without execution: %p', request => expect(isValidAnalyticsRequest(request)).toBe(false));
});
