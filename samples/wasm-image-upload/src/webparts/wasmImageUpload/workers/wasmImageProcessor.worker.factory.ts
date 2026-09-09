export function createWasmImageProcessorWorker(): Worker {
  return new Worker(new URL('./wasmImageProcessor.worker.js', import.meta.url));
}
