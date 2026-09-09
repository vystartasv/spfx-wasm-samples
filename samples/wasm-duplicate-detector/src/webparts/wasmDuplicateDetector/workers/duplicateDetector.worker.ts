import { generateFixture, RpcRequest, RpcResponse, RPC_VERSION, shapeResult, sha256Hex, validateInputs, HashInput, DetectorResult } from '../../../core/duplicateDetector';
const scope = self as unknown as { onmessage: ((event: MessageEvent<RpcRequest>) => void) | null; postMessage: (message: RpcResponse) => void };
let cancelled = new Set<string>();
function fail(request: RpcRequest, code: string, message: string): void { scope.postMessage({ version: RPC_VERSION, id: request.id, ok: false, error: { code, message } }); }
async function hash(request: RpcRequest): Promise<DetectorResult> {
  const inputs = request.fixtureCount ? generateFixture(request.fixtureCount) : request.files || [];
  const errors = validateInputs(inputs); if (errors.length) throw Object.assign(new Error(errors.join(' ')), { code: 'INVALID_INPUT' });
  if (!globalThis.crypto?.subtle) throw Object.assign(new Error('Browser Web Crypto SHA-256 is unavailable.'), { code: 'CRYPTO_UNAVAILABLE' });
  const started = performance.now(); const entries = [];
  for (const file of inputs) { if (cancelled.has(request.id)) throw Object.assign(new Error('Hash request cancelled.'), { code: 'CANCELLED' }); entries.push({ name: file.name, size: file.size, type: file.type, hash: await sha256Hex(file.data) }); }
  return shapeResult(entries, performance.now() - started, 'Browser Web Crypto SHA-256', ['No file bytes leave this browser.']);
}
scope.onmessage = event => { const request = event.data; if (!request || request.version !== RPC_VERSION || typeof request.id !== 'string') { if (request?.id) fail(request, 'BAD_REQUEST', 'Malformed or unsupported worker request.'); return; } if (request.method === 'cancel') { cancelled.add(request.id); return; } if (request.method !== 'hash') { fail(request, 'BAD_REQUEST', 'Unknown worker method.'); return; } hash(request).then(result => scope.postMessage({ version: RPC_VERSION, id: request.id, ok: true, result })).catch(error => fail(request, error?.code || 'WORKER_ERROR', error?.message || 'Worker hashing failed.')); };
