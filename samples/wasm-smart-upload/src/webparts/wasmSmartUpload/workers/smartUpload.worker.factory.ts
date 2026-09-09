export function createSmartUploadWorker(): Worker {
  return new Worker(new URL('./smartUpload.worker.js', import.meta.url), { type: 'module' });
}
