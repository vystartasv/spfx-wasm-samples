export function createDuckdbAnalyticsWorker(): Worker { return new Worker(new URL('./duckdbAnalytics.worker.js', import.meta.url), { type: 'module' }); }
