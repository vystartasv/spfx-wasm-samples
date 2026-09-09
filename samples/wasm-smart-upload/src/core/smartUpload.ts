export const RPC_VERSION = 1;
export const DEFAULT_CHUNK_SIZE = 4 * 1024 * 1024;
export const MIN_CHUNK_SIZE = 256 * 1024;
export const MAX_CHUNK_SIZE = 16 * 1024 * 1024;
export const MAX_FILE_BYTES = 512 * 1024 * 1024;
export const SMALL_UPLOAD_MAX_BYTES = 10 * 1024 * 1024;

export interface UploadInput { name: string; type: string; size: number; data: ArrayBuffer; }
export interface PreparedChunk { index: number; offset: number; size: number; hash: string; identity: string; }
export interface PrepareResult {
  name: string; type: string; size: number; fileHash: string; chunkSize: number; chunkCount: number;
  hashingMs: number; chunkingMs: number; totalMs: number; engine: 'Browser Web Crypto SHA-256';
  chunks: PreparedChunk[]; warnings: string[];
}
export interface PrepareRequest { version: number; id: string; input?: UploadInput; fixture?: boolean; chunkSize: number; method: 'prepare' | 'cancel'; }
export interface PrepareResponse { version: number; id: string; ok: boolean; result?: PrepareResult; error?: { code: string; message: string }; }
export function canPublishPrepareResult(cancelled: ReadonlySet<string>, requestId: string): boolean { return !cancelled.has(requestId); }

export function validateUpload(file: Pick<UploadInput, 'name' | 'size'> | undefined, chunkSize: number): string[] {
  const errors: string[] = [];
  if (!file) errors.push('Choose one file.');
  else {
    if (!file.name.trim()) errors.push('The file must have a name.');
    if (!Number.isFinite(file.size) || file.size < 0) errors.push('The file size is invalid.');
    else if (file.size > MAX_FILE_BYTES) errors.push(`The file exceeds the ${MAX_FILE_BYTES / 1024 / 1024} MB limit.`);
  }
  if (!Number.isInteger(chunkSize) || chunkSize < MIN_CHUNK_SIZE || chunkSize > MAX_CHUNK_SIZE) {
    errors.push(`Chunk size must be between ${MIN_CHUNK_SIZE / 1024} KB and ${MAX_CHUNK_SIZE / 1024 / 1024} MB.`);
  }
  return errors;
}

export function chunkRanges(size: number, chunkSize: number): Array<{ index: number; offset: number; size: number }> {
  const ranges: Array<{ index: number; offset: number; size: number }> = [];
  for (let offset = 0, index = 0; offset < size; offset += chunkSize, index += 1) ranges.push({ index, offset, size: Math.min(chunkSize, size - offset) });
  return ranges;
}

export async function sha256Hex(data: ArrayBuffer, subtle?: SubtleCrypto): Promise<string> {
  const digest = await (subtle || globalThis.crypto?.subtle).digest('SHA-256', data);
  return Array.prototype.map.call(new Uint8Array(digest), (value: number) => ('0' + value.toString(16)).slice(-2)).join('');
}

export function chunkIdentity(fileHash: string, chunk: Pick<PreparedChunk, 'index' | 'offset' | 'size' | 'hash'>): string {
  return `${fileHash}:${chunk.index}:${chunk.offset}:${chunk.size}:${chunk.hash}`;
}

export async function prepareUpload(input: UploadInput, chunkSize: number, cancelled: () => boolean = () => false, subtle?: SubtleCrypto): Promise<PrepareResult> {
  const errors = validateUpload(input, chunkSize);
  if (errors.length) throw Object.assign(new Error(errors.join(' ')), { code: 'INVALID_INPUT' });
  if (!subtle && !globalThis.crypto?.subtle) throw Object.assign(new Error('Browser Web Crypto SHA-256 is unavailable.'), { code: 'CRYPTO_UNAVAILABLE' });
  const started = performance.now();
  const fileHash = await sha256Hex(input.data, subtle);
  if (cancelled()) throw Object.assign(new Error('Preparation cancelled.'), { code: 'CANCELLED' });
  const hashingMs = performance.now() - started;
  const chunkStarted = performance.now();
  const chunks: PreparedChunk[] = [];
  for (const range of chunkRanges(input.size, chunkSize)) {
    if (cancelled()) throw Object.assign(new Error('Preparation cancelled.'), { code: 'CANCELLED' });
    const hash = await sha256Hex(input.data.slice(range.offset, range.offset + range.size), subtle);
    chunks.push({ ...range, hash, identity: chunkIdentity(fileHash, { ...range, hash }) });
  }
  const chunkingMs = performance.now() - chunkStarted;
  return { name: input.name, type: input.type, size: input.size, fileHash, chunkSize, chunkCount: chunks.length, hashingMs: Math.max(0, hashingMs), chunkingMs: Math.max(0, chunkingMs), totalMs: Math.max(0, performance.now() - started), engine: 'Browser Web Crypto SHA-256', chunks, warnings: ['Prepared locally; no file bytes were uploaded.'] };
}

export function createFixture(): UploadInput {
  const data = new Uint8Array(10 * 1024 * 1024 + 123);
  for (let index = 0; index < data.length; index += 1) data[index] = (index * 31 + 7) % 256;
  return { name: 'smart-upload-fixture.bin', type: 'application/octet-stream', size: data.byteLength, data: data.buffer };
}

export function simulateResumableTransfer(result: PrepareResult): string[] {
  // Deterministic local simulation: a real adapter must use these identities for retries.
  return result.chunks.map(chunk => chunk.identity);
}

export interface SmallUploadSource { name: string; type: string; data: ArrayBuffer; }
export interface UploadReceipt { url: string; bytes: number; remote: true; }
export interface IUploadAdapter {
  uploadSmall(source: SmallUploadSource): Promise<UploadReceipt>;
  uploadResumable?: (result: PrepareResult) => Promise<UploadReceipt>;
}
