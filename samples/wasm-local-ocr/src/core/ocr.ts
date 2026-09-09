export const RPC_VERSION = 1;
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export const ALLOWED_LANGUAGES = ['eng'] as const;
export type OcrLanguage = typeof ALLOWED_LANGUAGES[number];

export interface OcrRequest { version: number; type: 'recognize'; id: string; language: string; name: string; mimeType: string; bytes: number; data: ArrayBuffer; }
export interface OcrResult { engine: string; language: OcrLanguage; text: string; confidence?: number; elapsedMs: number; bytes: number; }
export type OcrResponse = { version: number; type: 'result'; id: string; result: OcrResult } | { version: number; type: 'cancelled' | 'error'; id?: string; message: string };

export function validateRequest(value: unknown): { ok: true; request: OcrRequest } | { ok: false; message: string } {
  if (!value || typeof value !== 'object') return { ok: false, message: 'Malformed OCR request.' };
  const input = value as Partial<OcrRequest>;
  if (input.version !== RPC_VERSION || input.type !== 'recognize' || typeof input.id !== 'string' || !input.id) return { ok: false, message: 'Unsupported or malformed OCR request.' };
  if (ALLOWED_LANGUAGES.indexOf(input.language as OcrLanguage) === -1) return { ok: false, message: 'Language is not packaged.' };
  if (typeof input.name !== 'string' || typeof input.mimeType !== 'string' || !/^image\/(png|jpeg|webp|gif|bmp|tiff|svg\+xml)$/.test(input.mimeType)) return { ok: false, message: 'Only supported image files can be recognized.' };
  const bytes = input.bytes;
  if (!Number.isInteger(bytes) || (bytes as number) < 1 || (bytes as number) > MAX_IMAGE_BYTES || !(input.data instanceof ArrayBuffer) || input.data.byteLength !== bytes) return { ok: false, message: `Image must be between 1 byte and ${MAX_IMAGE_BYTES} bytes.` };
  return { ok: true, request: input as OcrRequest };
}

export function shapeResult(id: string, language: OcrLanguage, text: unknown, confidence: unknown, elapsedMs: number, bytes: number): OcrResponse {
  return { version: RPC_VERSION, type: 'result', id, result: { engine: 'Tesseract.js 7.0.0 / Tesseract WASM LSTM', language, text: typeof text === 'string' ? text : '', ...(typeof confidence === 'number' && Number.isFinite(confidence) ? { confidence } : {}), elapsedMs: Math.max(0, Math.round(elapsedMs)), bytes } };
}
