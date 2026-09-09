import { DetectorResult, RPC_VERSION, RpcResponse } from '../../core/duplicateDetector';
import { createDuplicateDetectorWorker } from './workers/duplicateDetector.worker.factory';
export class DuplicateDetectorClient {
  private readonly worker = createDuplicateDetectorWorker(); private sequence = 0; private pending = new Map<string, { resolve: (value: DetectorResult) => void; reject: (error: Error) => void }>();
  public constructor() { this.worker.onmessage = event => { const response = event.data as RpcResponse; const item = this.pending.get(response.id); if (!item) return; this.pending.delete(response.id); response.ok && response.result ? item.resolve(response.result) : item.reject(new Error(response.error?.message || 'Worker request failed.')); }; this.worker.onerror = () => { this.pending.forEach(item => item.reject(new Error('Dedicated hashing worker failed.'))); this.pending.clear(); }; }
  public hash(files: Array<{ name: string; size: number; type: string; data: ArrayBuffer }>, fixtureCount?: number): Promise<DetectorResult> { const id = `hash-${++this.sequence}`; return new Promise((resolve, reject) => { this.pending.set(id, { resolve, reject }); this.worker.postMessage({ version: RPC_VERSION, id, method: 'hash', files, fixtureCount }, files.map(file => file.data)); }); }
  public cancel(id = `hash-${this.sequence}`): void { this.worker.postMessage({ version: RPC_VERSION, id, method: 'cancel' }); this.pending.get(id)?.reject(new Error('Hash request cancelled.')); this.pending.delete(id); }
  public terminate(): void { this.worker.terminate(); this.pending.forEach(item => item.reject(new Error('Hash worker terminated.'))); this.pending.clear(); }
}
