import { failure, shapeDuckdbRows, shapeResult } from './analytics';
import { aggregateRows, fixtureRows } from './fixture';
describe('result shaping', () => {
  test('preserves measured fields and failure state', () => {
    expect(shapeResult('duckdb', performance.now() - 2, 10, [], 'SELECT 1')).toMatchObject({ engine: 'duckdb', inputRows: 10, query: 'SELECT 1', status: 'ok' });
    expect(failure('duckdb', new Error('WASM unavailable'), 10, 'SELECT 1')).toMatchObject({ engine: 'duckdb', inputRows: 10, query: 'SELECT 1', status: 'error', error: 'WASM unavailable' });
  });

  test('DuckDB result shape has baseline parity', () => {
    const baseline = aggregateRows(fixtureRows(20));
    const duckdbShape = shapeDuckdbRows(baseline.map(row => ({ category: row.category, total_amount: row.totalAmount, total_quantity: row.totalQuantity, row_count: row.rowCount })));
    expect(duckdbShape).toEqual(baseline);
  });
});
