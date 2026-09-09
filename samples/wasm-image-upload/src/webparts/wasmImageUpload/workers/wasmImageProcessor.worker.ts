import encode, { init } from '@jsquash/jpeg/encode';
import wasmUrl from '@jsquash/jpeg/codec/enc/mozjpeg_enc.wasm';
import {
  IWorkerRequest,
  IWorkerResponse,
  shapeBenchmarkResult
} from '../imageProcessing';

type IWasmWorkerMessage = { ready: true } | IWorkerResponse;

const workerScope = self as unknown as {
  onmessage: ((event: MessageEvent<IWorkerRequest>) => void) | undefined;
  postMessage: (message: IWasmWorkerMessage, transfer?: Transferable[]) => void;
};

let codecReady: Promise<void> | undefined;

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

async function loadCodec(): Promise<void> {
  if (typeof WebAssembly !== 'object' || typeof WebAssembly.compile !== 'function') {
    throw new Error('WebAssembly is not available in this worker.');
  }
  if (!codecReady) {
    codecReady = (async () => {
      const response = await fetch(wasmUrl);
      if (!response.ok) {
        throw new Error(`mozjpeg WASM fetch failed with ${response.status}.`);
      }
      const module = await WebAssembly.compile(await response.arrayBuffer());
      await init(module);
    })();
  }
  await codecReady;
}

async function encodeWithWasm(pixels: ImageData, quality: number): Promise<ArrayBuffer> {
  await loadCodec();
  const encoded = await encode(pixels, { quality: Math.round(Math.max(0.01, Math.min(1, quality)) * 100) });
  if (!encoded.byteLength) {
    throw new Error('mozjpeg returned an empty result.');
  }
  return encoded;
}

function outputName(name: string): string {
  const baseName = name.replace(/\\/g, '/').split('/').pop() || 'image';
  return `${baseName.replace(/\.[^.]+$/, '') || 'image'}.jpg`;
}

async function decode(blob: Blob): Promise<{ bitmap: ImageBitmap; orientationAware: boolean }> {
  try {
    return {
      bitmap: await createImageBitmap(blob, { imageOrientation: 'from-image' }),
      orientationAware: true
    };
  } catch (error) {
    if (!(error instanceof TypeError)) {
      throw error;
    }
    return { bitmap: await createImageBitmap(blob), orientationAware: false };
  }
}

function addWarning(warnings: string[], warning: string): void {
  if (warnings.indexOf(warning) === -1) {
    warnings.push(warning);
  }
}

async function process(request: IWorkerRequest): Promise<IWorkerResponse> {
  if (typeof createImageBitmap !== 'function') {
    return { ok: false, error: 'This browser does not provide createImageBitmap in a worker.' };
  }
  if (typeof OffscreenCanvas === 'undefined') {
    return { ok: false, error: 'This browser does not provide OffscreenCanvas in a worker.' };
  }

  const started = performance.now();
  const outputFiles: Array<{ name: string; type: string; bytes: number; data: ArrayBuffer }> = [];
  const warnings = request.warnings ? request.warnings.slice() : [];
  let orientationAware = true;
  let usedWasm = false;
  let usedNative = false;

  for (const input of request.files) {
    const decoded = await decode(new Blob([input.data], { type: input.type }));
    orientationAware = orientationAware && decoded.orientationAware;
    if (!decoded.orientationAware) {
      addWarning(warnings, 'EXIF orientation was not available in this browser.');
    }

    const scale = Math.min(1, request.maxDimension / Math.max(decoded.bitmap.width, decoded.bitmap.height));
    const width = Math.max(1, Math.round(decoded.bitmap.width * scale));
    const height = Math.max(1, Math.round(decoded.bitmap.height * scale));
    const canvas = new OffscreenCanvas(width, height);
    const context = canvas.getContext('2d');
    if (!context) {
      decoded.bitmap.close();
      return { ok: false, error: 'This browser could not create a 2D worker canvas.' };
    }

    context.drawImage(decoded.bitmap, 0, 0, width, height);
    let output: Blob;
    try {
      const encoded = await encodeWithWasm(context.getImageData(0, 0, width, height), request.quality);
      output = new Blob([encoded], { type: 'image/jpeg' });
      usedWasm = true;
    } catch (error) {
      addWarning(warnings, `WASM JPEG encoding failed (${errorMessage(error)}); used browser-native encoding.`);
      output = await canvas.convertToBlob({ type: 'image/jpeg', quality: request.quality });
      usedNative = true;
    }
    decoded.bitmap.close();
    outputFiles.push({ name: outputName(input.name), type: 'image/jpeg', bytes: output.size, data: await output.arrayBuffer() });
  }

  const result = shapeBenchmarkResult(
    request.files.reduce((total, file) => total + file.bytes, 0),
    outputFiles.reduce((total, file) => total + file.bytes, 0),
    performance.now() - started,
    usedWasm && !usedNative ? 'WASM' : 'Browser-native',
    outputFiles,
    orientationAware,
    warnings
  );
  return { ok: true, result };
}

workerScope.onmessage = event => {
  process(event.data)
    .then(response => {
      const transfer = response.ok ? response.result.files.map(file => file.data) : [];
      workerScope.postMessage(response, transfer);
    })
    .catch(error => workerScope.postMessage({ ok: false, error: errorMessage(error) }));
};

workerScope.postMessage({ ready: true });
