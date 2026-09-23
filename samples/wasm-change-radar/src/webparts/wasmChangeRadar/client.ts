import { AnalysisInput, AnalysisResult, isRpcRequest, isRpcResponse, RPC_VERSION, RpcResponse } from '../../core/changeRadar';
import { createChangeRadarWorker } from './workers/changeRadar.worker.factory';

interface Pending { resolve: (result: AnalysisResult) => void; reject: (error: Error) => void; }

export class ChangeRadarClient {
  private readonly worker = createChangeRadarWorker();
  private readonly pending = new Map<string, Pending>();
  private sequence = 0;
  private activeId?: string;

  public constructor() {
    this.worker.onmessage = event => {
      if (!isRpcResponse(event.data)) return;
      const response = event.data as RpcResponse;
      const request = this.pending.get(response.id);
      if (!request) return;
      this.pending.delete(response.id);
      if (response.ok && response.result) request.resolve(response.result);
      else request.reject(new Error(response.error?.message || 'Change analysis worker failed.'));
    };
    this.worker.onerror = () => {
      this.pending.forEach(request => request.reject(new Error('Change analysis worker failed.')));
      this.pending.clear(); this.activeId = undefined;
    };
  }

  public analyze(payload: AnalysisInput): Promise<AnalysisResult> {
    this.cancel();
    const id = `change-${++this.sequence}`;
    const request = { version: RPC_VERSION, id, method: 'analyze' as const, payload };
    if (!isRpcRequest(request)) return Promise.reject(new Error('Change analysis input is invalid.'));
    this.activeId = id;
    return new Promise((resolve, reject) => { this.pending.set(id, { resolve, reject }); this.worker.postMessage(request); });
  }

  public cancel(): void {
    if (!this.activeId) return;
    const id = this.activeId; this.activeId = undefined;
    this.worker.postMessage({ version: RPC_VERSION, id, method: 'cancel' });
    this.pending.get(id)?.reject(new Error('Analysis request cancelled.'));
    this.pending.delete(id);
  }

  public dispose(): void {
    this.cancel(); this.worker.terminate();
    this.pending.forEach(request => request.reject(new Error('Change analysis worker disposed.')));
    this.pending.clear();
  }
}
