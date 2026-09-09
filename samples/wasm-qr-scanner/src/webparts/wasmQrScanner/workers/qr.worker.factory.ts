export function createQrWorker(): Worker { return new Worker(new URL('./qr.worker.js', import.meta.url)); }
