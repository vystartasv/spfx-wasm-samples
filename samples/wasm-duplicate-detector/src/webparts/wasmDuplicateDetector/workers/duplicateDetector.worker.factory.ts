export function createDuplicateDetectorWorker(): Worker { return new Worker(new URL('./duplicateDetector.worker.js', import.meta.url), { type: 'module' }); }
