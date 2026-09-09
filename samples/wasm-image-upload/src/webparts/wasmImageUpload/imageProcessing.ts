export const MAX_IMAGE_FILES = 20;
export const MAX_IMAGE_BYTES = 20 * 1024 * 1024;

export type ImageEngine = 'WASM' | 'Browser-native';

export interface IEngineSelection {
  engine: ImageEngine;
  warnings: string[];
}

export interface IProcessedImage {
  name: string;
  type: string;
  bytes: number;
  data: ArrayBuffer;
}

export interface IBenchmarkResult {
  engine: ImageEngine;
  originalBytes: number;
  optimizedBytes: number;
  bytesSaved: number;
  percentageSaved: number;
  durationMs: number;
  orientationAware: boolean;
  warnings: string[];
  files: IProcessedImage[];
}

export interface IWorkerInputFile {
  name: string;
  type: string;
  bytes: number;
  data: ArrayBuffer;
}

export interface IWorkerRequest {
  files: IWorkerInputFile[];
  maxDimension: number;
  quality: number;
  warnings?: string[];
}

export type IWorkerResponse =
  | { ok: true; result: IBenchmarkResult }
  | { ok: false; error: string };

function round(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) {
    return '0 B';
  }
  if (bytes < 1024) {
    return `${Math.round(bytes)} B`;
  }

  const units = ['KB', 'MB', 'GB'];
  let value = bytes;
  let unitIndex = -1;
  do {
    value /= 1024;
    unitIndex += 1;
  } while (value >= 1024 && unitIndex < units.length - 1);

  return `${round(value, 2)} ${units[unitIndex]}`;
}

export function calculatePercentageSaved(originalBytes: number, optimizedBytes: number): number {
  if (originalBytes <= 0 || !Number.isFinite(originalBytes) || !Number.isFinite(optimizedBytes)) {
    return 0;
  }
  return round(((originalBytes - optimizedBytes) / originalBytes) * 100, 2);
}

export function shapeBenchmarkResult(
  originalBytes: number,
  optimizedBytes: number,
  durationMs: number,
  engine: ImageEngine,
  files: IProcessedImage[],
  orientationAware: boolean,
  warnings: string[] = []
): IBenchmarkResult {
  return {
    engine,
    originalBytes,
    optimizedBytes,
    bytesSaved: originalBytes - optimizedBytes,
    percentageSaved: calculatePercentageSaved(originalBytes, optimizedBytes),
    durationMs: Math.max(0, durationMs),
    orientationAware,
    warnings,
    files
  };
}

export function selectImageEngine(wasmWorkerAvailable: boolean, fallbackWarning?: string): IEngineSelection {
  if (wasmWorkerAvailable) {
    return { engine: 'WASM', warnings: [] };
  }
  return {
    engine: 'Browser-native',
    warnings: fallbackWarning ? [fallbackWarning] : []
  };
}

export function validateImageFiles(files: ReadonlyArray<Pick<File, 'name' | 'size' | 'type'>>): string[] {
  const errors: string[] = [];
  if (files.length === 0) {
    return ['Select at least one image file.'];
  }
  if (files.length > MAX_IMAGE_FILES) {
    errors.push(`Select no more than ${MAX_IMAGE_FILES} image files at a time.`);
  }

  const totalBytes = files.reduce((total, file) => total + file.size, 0);
  if (totalBytes > MAX_IMAGE_BYTES) {
    errors.push(`Selected images exceed the ${formatBytes(MAX_IMAGE_BYTES)} total limit.`);
  }
  files.forEach(file => {
    if (!file.type.toLowerCase().startsWith('image/')) {
      errors.push(`${file.name} is not an image file.`);
    }
    if (file.size > MAX_IMAGE_BYTES) {
      errors.push(`${file.name} is larger than the ${formatBytes(MAX_IMAGE_BYTES)} limit.`);
    }
  });
  return errors;
}

export function optimizedFileName(name: string): string {
  const baseName = name.replace(/\\/g, '/').split('/').pop() || 'image';
  const withoutExtension = baseName.replace(/\.[^.]+$/, '');
  return `${withoutExtension || 'image'}.jpg`;
}
