import { analyzePages, AnalysisCancelledError, isRpcRequest, RpcRequest, RpcResponse, RPC_VERSION } from '../../../core/changeRadar';

const scope = self as unknown as { onmessage: ((event: MessageEvent<unknown>) => void) | null; postMessage: (message: RpcResponse) => void };
const cancelled = new Set<string>();

function responseError(id: string, code: string, message: string): void {
  scope.postMessage({ version: RPC_VERSION, id, ok: false, error: { code, message } });
}

async function run(request: Extract<RpcRequest, { method: 'analyze' }>): Promise<void> {
  try {
    const started = performance.now();
    const result = analyzePages(request.payload, () => cancelled.has(request.id));
    result.durationMs = Math.max(0, performance.now() - started);
    if (cancelled.has(request.id)) throw new AnalysisCancelledError();
    scope.postMessage({ version: RPC_VERSION, id: request.id, ok: true, result });
  } catch (error) {
    responseError(request.id, error instanceof AnalysisCancelledError ? 'CANCELLED' : (error as { code?: string }).code || 'WORKER_ERROR', error instanceof Error ? error.message : 'Change analysis failed.');
  } finally { cancelled.delete(request.id); }
}

scope.onmessage = event => {
  const value = event.data as { id?: unknown };
  const id = typeof value?.id === 'string' ? value.id : 'invalid';
  if (!isRpcRequest(event.data)) { responseError(id, 'BAD_REQUEST', 'Malformed or unsupported worker request.'); return; }
  if (event.data.method === 'cancel') { cancelled.add(event.data.id); return; }
  void run(event.data);
};
