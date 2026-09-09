import { createOcrWorker } from './workers/ocr.worker.factory';
import type { OcrRequest, OcrResponse } from '../../core/ocr';

export class OcrClient {
  private worker?: Worker;
  private pending?: { id: string; resolve: (value: OcrResponse) => void; reject: (reason: Error) => void; onStatus: (message: string) => void };
  public run(request: OcrRequest, onStatus: (message: string) => void): Promise<OcrResponse> {
    this.cancel(); this.worker = createOcrWorker();
    return new Promise((resolve, reject) => { this.pending = { id: request.id, resolve, reject, onStatus }; this.worker!.onmessage = event => { const value = event.data as { type?: string; message?: string }; if (value.type === 'status') { onStatus(value.message || 'OCR progress'); return; } if (value.type === 'result' || value.type === 'cancelled' || value.type === 'error') { this.pending = undefined; resolve(value as OcrResponse); } }; this.worker!.onerror = event => { this.pending = undefined; reject(new Error(event.message || 'OCR worker failed.')); }; this.worker!.postMessage(request, [request.data]); });
  }
  public cancel(): void { if (this.worker && this.pending) this.worker.postMessage({ version: 1, type: 'cancel', id: this.pending.id }); this.worker?.terminate(); this.worker = undefined; this.pending = undefined; }
  public dispose(): void { this.cancel(); }
}
