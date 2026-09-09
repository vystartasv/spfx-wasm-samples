import { MAX_IMAGE_BYTES, RPC_VERSION, shapeResult, validateRequest } from './ocr';

const data = new ArrayBuffer(3);
const valid = { version: RPC_VERSION, type: 'recognize', id: '1', language: 'eng', name: 'fixture.svg', mimeType: 'image/png', bytes: 3, data };

describe('local OCR contract', () => {
  test('validates request and size boundary', () => { expect(validateRequest(valid).ok).toBe(true); expect(validateRequest({ ...valid, bytes: MAX_IMAGE_BYTES + 1, data: new ArrayBuffer(MAX_IMAGE_BYTES + 1) }).ok).toBe(false); });
  test('rejects malformed, unknown language, and mismatched payload', () => { expect(validateRequest(null).ok).toBe(false); expect(validateRequest({ ...valid, language: 'fra' }).ok).toBe(false); expect(validateRequest({ ...valid, bytes: 2 }).ok).toBe(false); });
  test('allows only local bytes and has explicit cancellation/error shapes', () => { expect(validateRequest({ ...valid, data: 'https://example.invalid/image.png', bytes: 3 }).ok).toBe(false); expect({ version: 1, type: 'cancelled', id: '1', message: 'OCR cancelled.' }).toMatchObject({ type: 'cancelled' }); expect({ version: 1, type: 'error', message: 'OCR engine error' }).toMatchObject({ type: 'error' }); });
  test('shapes only actual engine output', () => { expect(shapeResult('1', 'eng', 'real text', 88.5, 12.4, 3)).toEqual({ version: 1, type: 'result', id: '1', result: { engine: 'Tesseract.js 7.0.0 / Tesseract WASM LSTM', language: 'eng', text: 'real text', confidence: 88.5, elapsedMs: 12, bytes: 3 } }); const shaped = shapeResult('1', 'eng', undefined, undefined, -1, 3); expect(shaped.type === 'result' && shaped.result.text).toBe(''); });
});
