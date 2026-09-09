export const RPC_VERSION = 1;
export const MAX_FILES = 100;
export const MAX_FILE_BYTES = 50 * 1024 * 1024;
export const MAX_TOTAL_BYTES = 200 * 1024 * 1024;

export interface HashInput { name: string; size: number; type: string; data: ArrayBuffer; }
export interface HashEntry { name: string; size: number; type: string; hash: string; }
export interface DuplicateGroup { hash: string; size: number; files: Array<{ name: string; size: number; type: string }>; }
export interface DetectorResult { durationMs: number; bytesScanned: number; groups: DuplicateGroup[]; duplicateBytes: number; engine: 'Browser Web Crypto SHA-256' | 'WASM'; warnings: string[]; }
export interface RpcRequest { version: number; id: string; method: 'hash' | 'cancel'; files?: HashInput[]; fixtureCount?: number; }
export interface RpcResponse { version: number; id: string; ok: boolean; result?: DetectorResult; error?: { code: string; message: string }; }

export function validateInputs(files: ReadonlyArray<Pick<HashInput, 'name' | 'size'>>): string[] {
  const errors: string[] = [];
  if (!files.length) errors.push('Select at least one file.');
  if (files.length > MAX_FILES) errors.push(`Select no more than ${MAX_FILES} files.`);
  const total = files.reduce((sum, file) => sum + file.size, 0);
  if (total > MAX_TOTAL_BYTES) errors.push(`Selected files exceed the ${MAX_TOTAL_BYTES / 1024 / 1024} MB total limit.`);
  files.forEach(file => { if (!Number.isFinite(file.size) || file.size < 0) errors.push(`${file.name}: invalid size.`); else if (file.size > MAX_FILE_BYTES) errors.push(`${file.name} is larger than ${MAX_FILE_BYTES / 1024 / 1024} MB.`); });
  return errors;
}

export function groupHashes(entries: ReadonlyArray<HashEntry>): DuplicateGroup[] {
  const groups = new Map<string, DuplicateGroup>();
  entries.forEach(entry => { const group = groups.get(entry.hash) || { hash: entry.hash, size: entry.size, files: [] }; group.files.push({ name: entry.name, size: entry.size, type: entry.type }); groups.set(entry.hash, group); });
  return Array.from(groups.values()).filter(group => group.files.length > 1).sort((a, b) => a.hash.localeCompare(b.hash));
}

export function duplicateBytes(groups: ReadonlyArray<DuplicateGroup>): number { return groups.reduce((total, group) => total + group.files.slice(1).reduce((bytes, file) => bytes + file.size, 0), 0); }

export async function sha256Hex(data: ArrayBuffer, subtle: SubtleCrypto = crypto.subtle): Promise<string> {
  const digest = await subtle.digest('SHA-256', data);
  return Array.prototype.map.call(new Uint8Array(digest), (value: number) => ('0' + value.toString(16)).slice(-2)).join('');
}

export function shapeResult(entries: HashEntry[], durationMs: number, engine: DetectorResult['engine'], warnings: string[] = []): DetectorResult {
  const groups = groupHashes(entries);
  return { durationMs: Math.max(0, durationMs), bytesScanned: entries.reduce((total, entry) => total + entry.size, 0), groups, duplicateBytes: duplicateBytes(groups), engine, warnings };
}

export interface SyntheticFileRecord { name: string; size: number; type: string; data: ArrayBuffer; }
function asciiBytes(value: string): ArrayBuffer { const data = new Uint8Array(value.length); for (let index = 0; index < value.length; index += 1) data[index] = value.charCodeAt(index); return data.buffer; }
export function generateFixture(count = 10000): SyntheticFileRecord[] {
  return Array.from({ length: count }, (_, index) => { const content = `deterministic-content-${index % 250}`; const data = asciiBytes(content); const number = ('00000' + (index + 1)).slice(-5); return { name: `synthetic-${number}.txt`, size: data.byteLength, type: 'text/plain', data }; });
}
