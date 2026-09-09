import { createDataPlaneWorker } from './workers/dataPlane.worker.factory';
import { CONTRACT_VERSION, Namespace, QueryOptions, RpcResponse } from '../../core/types';

export class DataPlaneClient {
  private worker?: Worker;
  private sequence = 0;
  private pending = new Map<string, { resolve: (value: unknown) => void; reject: (error: Error) => void }>();
  private start(): Worker { if (this.worker) return this.worker; const worker = this.worker = createDataPlaneWorker(); worker.onmessage = event => { const response = event.data as RpcResponse; const item = this.pending.get(response.id); if (!item) return; this.pending.delete(response.id); if (response.ok) item.resolve(response.result); else item.reject(Object.assign(new Error(response.error?.message || 'Worker request failed.'), response.error)); }; worker.onerror = event => { this.worker = undefined; worker.terminate(); this.pending.forEach(item => item.reject(new Error(event.message || 'Data plane worker failed.'))); this.pending.clear(); }; return worker; }
  request<T>(method: string, payload?: unknown): Promise<T> { const id = `rpc-${++this.sequence}`; const worker = this.start(); return new Promise<T>((resolve, reject) => { this.pending.set(id, { resolve: resolve as (value: unknown) => void, reject }); try { worker.postMessage({ version: CONTRACT_VERSION, id, method, payload }); } catch (error) { this.pending.delete(id); reject(error instanceof Error ? error : new Error(String(error))); } }); }
  init(namespace: Namespace): Promise<unknown> { return this.request('init', namespace); }
  terminate(): void { this.worker?.terminate(); this.worker = undefined; this.pending.forEach(item => item.reject(new Error('Data plane client terminated.'))); this.pending.clear(); }
  status(): Promise<unknown> { return this.request('status'); }
  hydrate(): Promise<unknown> { return this.request('hydrate'); }
  sync(source?: string, failure?: string): Promise<unknown> { return this.request('sync', { source, failure }); }
  query(options: QueryOptions): Promise<unknown> { return this.request('query-showcase', options); }
  mutate(id: string, patch: unknown): Promise<unknown> { return this.request('mutate-optimistic-project', { id, patch }); }
  flush(): Promise<unknown> { return this.request('flush-outbox'); }
  simulateConflict(): Promise<unknown> { return this.request('simulate-conflict'); }
  clear(): Promise<unknown> { return this.request('clear-data'); }
}
