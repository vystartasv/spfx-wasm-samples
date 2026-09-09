export function createSqliteCacheWorker(): Worker { return new Worker(new URL('./sqliteCache.worker.js', import.meta.url), { type: 'module' }); }
