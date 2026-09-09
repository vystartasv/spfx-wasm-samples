import { createDuckdbAnalyticsWorker } from './workers/duckdbAnalytics.worker.factory';
import type { MeasuredResult } from '../../core/analytics';
export class AnalyticsClient {
  private worker?: Worker;
  private nextId = 0;
  private pending = new Map<number, { resolve: (value: unknown) => void; reject: (error: Error) => void }>();
  private start(): Worker {
    if (this.worker) return this.worker;
    const worker = this.worker = createDuckdbAnalyticsWorker();
    worker.onmessage = event => { const pending = this.pending.get(event.data.id); if (!pending) return; this.pending.delete(event.data.id); event.data.ok ? pending.resolve(event.data.result) : pending.reject(new Error(event.data.error)); };
    worker.onerror = event => { this.worker = undefined; worker.terminate(); this.pending.forEach(pending => pending.reject(new Error(event.message || 'DuckDB worker failed.'))); this.pending.clear(); };
    return worker;
  }
  public request(method: 'load' | 'run' | 'clear'): Promise<unknown> { const id = ++this.nextId; this.start(); return new Promise((resolve, reject) => { this.pending.set(id, { resolve, reject }); this.worker?.postMessage({ id, method }); }); }
  public terminate(): void { this.worker?.terminate(); this.worker = undefined; this.pending.forEach(pending => pending.reject(new Error('DuckDB client terminated.'))); this.pending.clear(); }
  public load(): Promise<{ rowCount: number }> { return this.request('load') as Promise<{ rowCount: number }>; }
  public run(): Promise<MeasuredResult> { return this.request('run') as Promise<MeasuredResult>; }
  public clear(): Promise<{ status: string }> { return this.request('clear') as Promise<{ status: string }>; }
}
