export function createChangeRadarWorker(): Worker {
  return new Worker(new URL('./changeRadar.worker.js', import.meta.url), { type: 'module' });
}
