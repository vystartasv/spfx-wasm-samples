export interface AnalyticsRow { category: string; amount: number; quantity: number; }
export const FIXTURE_ROW_COUNT = 100_000;

export function rowAt(index: number): AnalyticsRow {
  return { category: `category-${index % 10}`, amount: ((index * 17) % 1000) / 10, quantity: (index % 7) + 1 };
}

export function* fixtureRows(count = FIXTURE_ROW_COUNT): Generator<AnalyticsRow> {
  for (let index = 0; index < count; index += 1) yield rowAt(index);
}

export interface Aggregate { category: string; totalAmount: number; totalQuantity: number; rowCount: number; }

export function aggregateRows(rows: Iterable<AnalyticsRow>): Aggregate[] {
  const result = new Map<string, Aggregate>();
  for (const row of Array.from(rows)) {
    const current = result.get(row.category) || { category: row.category, totalAmount: 0, totalQuantity: 0, rowCount: 0 };
    current.totalAmount += row.amount;
    current.totalQuantity += row.quantity;
    current.rowCount += 1;
    result.set(row.category, current);
  }
  return Array.from(result.values()).sort((left, right) => left.category.localeCompare(right.category));
}

export const AGGREGATION_SQL = 'SELECT category, SUM(amount) AS total_amount, SUM(quantity) AS total_quantity, COUNT(*) AS row_count FROM fixture GROUP BY category ORDER BY category';
