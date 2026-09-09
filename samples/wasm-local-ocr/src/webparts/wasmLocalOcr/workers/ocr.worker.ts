import { createWorker } from 'tesseract.js';
import workerScript from 'tesseract.js/dist/worker.min.js';
import coreScript from 'tesseract.js-core/tesseract-core-lstm.wasm.js';
import coreWasm from 'tesseract.js-core/tesseract-core-lstm.wasm';
import engData from '@tesseract.js-data/eng/4.0.0_best_int/eng.traineddata.gz';
import { RPC_VERSION, shapeResult, validateRequest, type OcrRequest } from '../../../core/ocr';

void coreWasm;
const scope = self as unknown as { onmessage: ((event: MessageEvent) => void) | null; postMessage: (value: unknown) => void };
let engine: Awaited<ReturnType<typeof createWorker>> | undefined;
let activeId: string | undefined;
let cancelled = new Set<string>();

function status(id: string, message: string, progress?: number): void { scope.postMessage({ version: RPC_VERSION, type: 'status', id, message, ...(progress === undefined ? {} : { progress }) }); }
function assetDirectory(asset: string): string { return asset.slice(0, asset.lastIndexOf('/') + 1); }

async function getEngine(language: string, id: string): Promise<Awaited<ReturnType<typeof createWorker>>> {
  if (engine) return engine;
  status(id, 'Loading packaged Tesseract WASM engine…', 0);
  engine = await createWorker(language, undefined, { workerPath: workerScript, corePath: coreScript, langPath: assetDirectory(engData), cacheMethod: 'write', gzip: true, logger: message => {
    const progress = typeof message.progress === 'number' ? message.progress : undefined;
    status(id, message.status || 'OCR engine progress', progress);
  } });
  status(id, 'Packaged OCR engine ready.', 1);
  return engine;
}

async function recognize(request: OcrRequest): Promise<void> {
  activeId = request.id;
  const started = performance.now();
  try {
    const ocr = await getEngine(request.language, request.id);
    if (cancelled.has(request.id)) throw new Error('CANCELLED');
    status(request.id, 'Recognizing image locally…', 0);
    const result = await ocr.recognize(new Blob([request.data], { type: request.mimeType }), {}, { text: true });
    if (cancelled.has(request.id)) throw new Error('CANCELLED');
    scope.postMessage(shapeResult(request.id, 'eng', result.data.text, result.data.confidence, performance.now() - started, request.bytes));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    scope.postMessage(message === 'CANCELLED' ? { version: RPC_VERSION, type: 'cancelled', id: request.id, message: 'OCR cancelled.' } : { version: RPC_VERSION, type: 'error', id: request.id, message: `OCR engine error: ${message}` });
  } finally { cancelled.delete(request.id); activeId = undefined; }
}

scope.onmessage = event => {
  const value = event.data as { type?: string; id?: string };
  if (value && value.type === 'cancel' && typeof value.id === 'string') { cancelled.add(value.id); if (activeId === value.id) { void engine?.terminate(); engine = undefined; } return; }
  const checked = validateRequest(event.data);
  if (!checked.ok) { scope.postMessage({ version: RPC_VERSION, type: 'error', message: checked.message }); return; }
  void recognize(checked.request);
};
