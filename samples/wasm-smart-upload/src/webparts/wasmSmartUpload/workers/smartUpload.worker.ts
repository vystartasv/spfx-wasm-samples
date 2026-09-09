import { createFixture, prepareUpload, PrepareRequest, PrepareResponse, RPC_VERSION } from '../../../core/smartUpload';

const scope = self as unknown as { onmessage: ((event: MessageEvent<PrepareRequest>) => void) | null; postMessage: (message: PrepareResponse) => void };
const cancelled = new Set<string>();

scope.onmessage = event => {
  const request = event.data;
  if (!request || request.version !== RPC_VERSION || typeof request.id !== 'string') return;
  if (request.method === 'cancel') { cancelled.add(request.id); return; }
  if (request.method !== 'prepare') return;
  const input = request.fixture ? createFixture() : request.input;
  if (!input) { scope.postMessage({ version: RPC_VERSION, id: request.id, ok: false, error: { code: 'INVALID_INPUT', message: 'A file is required.' } }); return; }
  prepareUpload(input, request.chunkSize, () => cancelled.has(request.id)).then(result => {
    scope.postMessage({ version: RPC_VERSION, id: request.id, ok: true, result });
  }).catch(error => {
    scope.postMessage({ version: RPC_VERSION, id: request.id, ok: false, error: { code: error?.code || 'WORKER_ERROR', message: error?.message || 'Worker preparation failed.' } });
  });
};
