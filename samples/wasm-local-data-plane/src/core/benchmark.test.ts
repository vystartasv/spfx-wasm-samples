import { BENCHMARK_SCENARIOS, runBenchmark } from './benchmark';

describe('benchmark service', () => {
  test('runs every milestone scenario and records action output', async () => {
    const action = async (): Promise<{ rows: number; networkRequests: number; networkBytes: number }> => ({ rows: 3, networkRequests: 1, networkBytes: 12 });
    const result = await runBenchmark({ coldHydration: action, warmQuery: action, zeroChangeSync: action, changedSync: async count => ({ rows: count, networkRequests: count, networkBytes: count }), filter: action, sort: action, crossSourceJoin: action, offlineRead: action, optimisticWrite: action, reconnect: action, conflict: action }, () => 99);
    expect(result.map(item => item.scenario)).toEqual(BENCHMARK_SCENARIOS);
    expect(result[3]).toMatchObject({ rows: 1, networkRequests: 1, dbBytes: 99 });
  });
});
