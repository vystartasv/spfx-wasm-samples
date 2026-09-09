export function createPdfWorker(): Worker { return new Worker(new URL('./pdf.worker.js', import.meta.url)); }
