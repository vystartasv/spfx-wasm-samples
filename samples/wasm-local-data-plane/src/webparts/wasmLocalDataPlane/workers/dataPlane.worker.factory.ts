export function createDataPlaneWorker(): Worker { return new Worker(new URL('./dataPlane.worker.js', import.meta.url), { type: 'module' }); }
