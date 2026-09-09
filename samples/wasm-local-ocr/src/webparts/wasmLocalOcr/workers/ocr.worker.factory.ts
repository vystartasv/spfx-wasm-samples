export function createOcrWorker(): Worker { return new Worker(new URL('./ocr.worker.js', import.meta.url)); }
