import type { IWorkerInputFile } from '../imageProcessing';

export function createImageProcessorWorker(): Worker {
  const source = `(${workerMain.toString()})();`;
  const url = URL.createObjectURL(new Blob([source], { type: 'text/javascript' }));
  const worker = new Worker(url);
  const revokeUrl = (): void => URL.revokeObjectURL(url);
  worker.addEventListener('message', revokeUrl, { once: true });
  worker.addEventListener('error', revokeUrl, { once: true });
  return worker;
}

function workerMain(): void {
  const workerScope = self as unknown as {
    onmessage: ((event: MessageEvent) => void) | undefined;
    postMessage: (message: unknown, transfer?: Transferable[]) => void;
  };

  function round(value: number, decimals: number): number {
    const factor = Math.pow(10, decimals);
    return Math.round(value * factor) / factor;
  }

  function percentageSaved(originalBytes: number, optimizedBytes: number): number {
    if (originalBytes <= 0 || !Number.isFinite(originalBytes) || !Number.isFinite(optimizedBytes)) {
      return 0;
    }
    return round(((originalBytes - optimizedBytes) / originalBytes) * 100, 2);
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

  async function process(request: { files: IWorkerInputFile[]; maxDimension: number; quality: number }): Promise<unknown> {
    if (typeof createImageBitmap !== 'function') {
      return { ok: false, error: 'This browser does not provide createImageBitmap in a worker.' };
    }
    if (typeof OffscreenCanvas === 'undefined') {
      return { ok: false, error: 'This browser does not provide OffscreenCanvas in a worker.' };
    }

    const started = performance.now();
    const outputFiles: Array<{ name: string; type: string; bytes: number; data: ArrayBuffer }> = [];
    let orientationAware = true;
    const warnings: string[] = [];

    for (const input of request.files) {
      const decoded = await decode(new Blob([input.data], { type: input.type }));
      orientationAware = orientationAware && decoded.orientationAware;
      if (!decoded.orientationAware && warnings.indexOf('EXIF orientation was not available in this browser.') === -1) {
        warnings.push('EXIF orientation was not available in this browser.');
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
      const output = await canvas.convertToBlob({ type: 'image/jpeg', quality: request.quality });
      decoded.bitmap.close();
      outputFiles.push({ name: outputName(input.name), type: 'image/jpeg', bytes: output.size, data: await output.arrayBuffer() });
    }

    const originalBytes = request.files.reduce((total, file) => total + file.bytes, 0);
    const optimizedBytes = outputFiles.reduce((total, file) => total + file.bytes, 0);
    return {
      ok: true,
      result: {
        engine: 'Browser-native worker',
        originalBytes,
        optimizedBytes,
        bytesSaved: originalBytes - optimizedBytes,
        percentageSaved: percentageSaved(originalBytes, optimizedBytes),
        durationMs: Math.max(0, performance.now() - started),
        orientationAware,
        warnings,
        files: outputFiles
      }
    };
  }

  workerScope.onmessage = event => {
    process(event.data)
      .then(response => {
        const transfer = (response as { ok?: boolean; result?: { files: Array<{ data: ArrayBuffer }> } }).ok
          ? (response as { result: { files: Array<{ data: ArrayBuffer }> } }).result.files.map(file => file.data)
          : [];
        workerScope.postMessage(response, transfer);
      })
      .catch(error => workerScope.postMessage({ ok: false, error: error instanceof Error ? error.message : 'Image processing failed.' }));
  };
}
