import { AGGREGATION_SQL, aggregateRows, fixtureRows, rowAt } from './fixture';

describe('analytics fixture contract', () => {
  test('is deterministic and lazy', () => {
    expect(rowAt(0)).toEqual({ category: 'category-0', amount: 0, quantity: 1 });
    expect(Array.from(fixtureRows(3))).toEqual([rowAt(0), rowAt(1), rowAt(2)]);
    expect(fixtureRows(100000)[Symbol.iterator]).toBeDefined();
  });

  test('baseline produces stable grouped results', () => {
    const actual = aggregateRows(fixtureRows(20));
    const independent = Array.from({ length: 10 }, (_, index) => {
      const rows = Array.from({ length: 2 }, (_, offset) => rowAt(index + offset * 10));
      return { category: 'category-' + index, totalAmount: rows[0].amount + rows[1].amount, totalQuantity: rows[0].quantity + rows[1].quantity, rowCount: 2 };
    });
    expect(actual).toEqual(independent);
  });

  test('query contract is explicit', () => expect(AGGREGATION_SQL).toContain('GROUP BY category'));
});
