import * as React from 'react';
import styles from './WasmSmartUpload.module.scss';
import type { IWasmSmartUploadProps } from './IWasmSmartUploadProps';
import { createFixture, DEFAULT_CHUNK_SIZE, prepareUpload, PrepareRequest, PrepareResponse, PrepareResult, RPC_VERSION, SMALL_UPLOAD_MAX_BYTES, simulateResumableTransfer, validateUpload } from '../../../core/smartUpload';
import { createSmartUploadWorker } from '../workers/smartUpload.worker.factory';

interface State { file?: File; result?: PrepareResult; chunkSize: number; status: string; error?: string; warning?: string; busy: boolean; simulated: boolean; uploadedUrl?: string; }

export default class WasmSmartUpload extends React.Component<IWasmSmartUploadProps, State> {
  private readonly input = React.createRef<HTMLInputElement>();
  private worker?: Worker;
  private requestId?: string;
  private readonly cancelled = new Set<string>();
  public state: State = { chunkSize: DEFAULT_CHUNK_SIZE, status: 'Choose a file or run the deterministic fixture.', busy: false, simulated: false };

  public componentWillUnmount(): void { this.worker?.terminate(); }

  public render(): React.ReactElement {
    const { file, result, busy } = this.state;
    return <section className={styles.root} aria-labelledby="smart-upload-title">
      <h2 id="smart-upload-title">Privacy-first smart upload accelerator</h2>
      <p>Hashing and deterministic chunk preparation run locally in a Web Worker. Nothing is uploaded by Prepare.</p>
      <div className={styles.dropZone} onDragOver={this.onDragOver} onDrop={this.onDrop}>
        <label htmlFor="smart-upload-file">Choose a file</label>
        <input ref={this.input} id="smart-upload-file" type="file" onChange={this.onChange} disabled={busy} />
        <p className={styles.hint}>Or drop one file here. Maximum {512} MB.</p>
        {file && <p><strong>{file.name}</strong> · {file.size.toLocaleString()} bytes</p>}
      </div>
      <div className={styles.toolbar} aria-label="Smart upload controls">
        <label htmlFor="smart-upload-chunk-size">Chunk size<select id="smart-upload-chunk-size" value={this.state.chunkSize} onChange={this.onChunkSize} disabled={busy}>
          {[256, 512, 1024, 4096, 8192, 16384].map(value => <option key={value} value={value * 1024}>{value >= 1024 ? `${value / 1024} MB` : `${value} KB`}</option>)}
        </select></label>
        <button type="button" onClick={this.prepare} disabled={busy || !file}>{busy ? 'Preparing…' : 'Prepare locally'}</button>
        <button type="button" onClick={this.fixture} disabled={busy}>Run deterministic fixture</button>
        <button type="button" onClick={this.cancel} disabled={!busy}>Cancel</button>
        <button type="button" onClick={this.reset} disabled={busy}>Reset</button>
      </div>
      <div className={styles.status} role="status" aria-live="polite" aria-atomic="true">{this.state.status}</div>
      {this.state.error && <p className={styles.error} role="alert">{this.state.error}</p>}
      {this.state.warning && <p className={styles.warning} role="status">{this.state.warning}</p>}
      <div className={styles.boundary}><strong>Remote boundary:</strong> the real SharePoint adapter below is available only for files up to {SMALL_UPLOAD_MAX_BYTES / 1024 / 1024} MB. Resumable/chunked transfer is a local simulation until an explicit createUploadSession-compatible adapter is supplied.</div>
      {result && <div className={styles.results} aria-labelledby="smart-upload-results-title">
        <h3 id="smart-upload-results-title">Measured preparation result</h3>
        <dl><dt>Engine</dt><dd>{result.engine}</dd><dt>File SHA-256</dt><dd><code>{result.fileHash}</code></dd><dt>Chunk count</dt><dd>{result.chunkCount}</dd><dt>Chunk size</dt><dd>{result.chunkSize.toLocaleString()} bytes</dd><dt>Hashing time</dt><dd>{result.hashingMs.toFixed(2)} ms</dd><dt>Chunking time</dt><dd>{result.chunkingMs.toFixed(2)} ms</dd><dt>Total measured time</dt><dd>{result.totalMs.toFixed(2)} ms</dd></dl>
        <p>Retry-safe identity example: <code>{result.chunks[0]?.identity || 'empty file'}</code></p>
        {result.warnings.map(warning => <p className={styles.warning} key={warning}>{warning}</p>)}
        <button type="button" onClick={this.simulate} disabled={busy}>Run local resumable simulation</button>
        {file && file.size <= SMALL_UPLOAD_MAX_BYTES && <button type="button" onClick={this.uploadSmall} disabled={busy}>Upload small file to SharePoint</button>}
        {this.state.simulated && <p role="status">Local simulation verified {result.chunkCount} deterministic chunk identities; no network request was made.</p>}
        {this.state.uploadedUrl && <p role="status">Uploaded to <code>{this.state.uploadedUrl}</code>.</p>}
      </div>}
    </section>;
  }

  private onDragOver = (event: React.DragEvent<HTMLDivElement>): void => { event.preventDefault(); };
  private onDrop = (event: React.DragEvent<HTMLDivElement>): void => { event.preventDefault(); this.select(event.dataTransfer.files[0]); };
  private onChange = (event: React.ChangeEvent<HTMLInputElement>): void => { this.select(event.target.files?.[0]); };
  private select = (file?: File): void => { const errors = validateUpload(file && { name: file.name, size: file.size }, this.state.chunkSize); this.setState({ file: errors.length ? undefined : file, result: undefined, error: errors.length ? errors.join(' ') : undefined, uploadedUrl: undefined, simulated: false, status: errors.length ? 'Selection needs attention.' : `${file?.name} selected.` }); };
  private onChunkSize = (event: React.ChangeEvent<HTMLSelectElement>): void => this.setState({ chunkSize: Number(event.target.value), result: undefined });
  private fixture = async (): Promise<void> => this.run(undefined, true);
  private prepare = async (): Promise<void> => this.run(this.state.file, false);
  private run = async (file: File | undefined, fixture: boolean): Promise<void> => {
    const input = fixture ? undefined : file;
    if (!fixture && !input) return;
    this.setState({ busy: true, result: undefined, error: undefined, warning: undefined, simulated: false, uploadedUrl: undefined, status: 'Reading the file and starting the worker…' });
    try {
      const value = fixture ? undefined : { name: input!.name, type: input!.type, size: input!.size, data: await input!.arrayBuffer() };
      const result = await this.workerPrepare({ version: RPC_VERSION, id: `prepare-${Date.now()}`, method: 'prepare', fixture, input: value, chunkSize: this.state.chunkSize });
      this.setState({ busy: false, result, status: 'Preparation complete. All values below were measured locally.' });
    } catch (error) {
      const shaped = error as { code?: string; message?: string };
      if (shaped.code === 'CANCELLED') this.setState({ busy: false, status: 'Preparation cancelled.' });
      else this.setState({ busy: false, error: shaped.message || String(error), status: 'Worker preparation failed; no upload occurred.' });
    }
  };
  private workerPrepare = (request: PrepareRequest): Promise<PrepareResult> => new Promise((resolve, reject) => {
    if (typeof Worker === 'undefined') { this.setState({ warning: 'Web Workers are unavailable; using the browser-native fallback on the page.' }); this.nativePrepare(request, resolve, reject); return; }
    let worker: Worker;
    try { worker = createSmartUploadWorker(); this.worker = worker; } catch (error) { this.setState({ warning: `Worker startup failed (${String(error)}); using the browser-native fallback.` }); this.nativePrepare(request, resolve, reject); return; }
    const fallbackRequest = request.input ? { ...request, input: { ...request.input, data: request.input.data.slice(0) } } : request;
    this.requestId = request.id;
    worker.onmessage = (event: MessageEvent<PrepareResponse>) => {
      worker.terminate(); this.worker = undefined; this.requestId = undefined;
      if (event.data.ok) { resolve(event.data.result!); return; }
      if (event.data.error?.code === 'WORKER_ERROR' || event.data.error?.code === 'CRYPTO_UNAVAILABLE') { this.setState({ warning: `Worker reported ${event.data.error.code}; using the browser-native fallback.` }); this.nativePrepare(fallbackRequest, resolve, reject, event.data.error.message); return; }
      reject(Object.assign(new Error(event.data.error?.message), event.data.error));
    };
    worker.onerror = event => { worker.terminate(); this.worker = undefined; this.nativePrepare(fallbackRequest, resolve, reject, event.message || 'Worker failed.'); };
    const transfer = request.input ? [request.input.data] : [];
    worker.postMessage(request, transfer);
  });
  private nativePrepare = (request: PrepareRequest, resolve: (result: PrepareResult) => void, reject: (error: Error) => void, warning?: string): void => {
    const input = request.fixture ? createFixture() : request.input;
    if (!input) { reject(Object.assign(new Error('A file is required.'), { code: 'INVALID_INPUT' })); return; }
    prepareUpload(input, request.chunkSize, () => this.cancelled.has(request.id)).then(result => { if (warning) result.warnings.push(`Worker fallback: ${warning}`); resolve(result); }, reject);
  };
  private cancel = (): void => { if (this.requestId) this.cancelled.add(this.requestId); if (this.worker && this.requestId) this.worker.postMessage({ version: RPC_VERSION, id: this.requestId, method: 'cancel', chunkSize: this.state.chunkSize }); else this.worker?.terminate(); this.worker = undefined; this.setState({ busy: false, status: 'Preparation cancelled.' }); };
  private reset = (): void => { this.worker?.terminate(); this.worker = undefined; if (this.input.current) this.input.current.value = ''; this.setState({ file: undefined, result: undefined, error: undefined, warning: undefined, simulated: false, uploadedUrl: undefined, busy: false, status: 'Choose a file or run the deterministic fixture.' }); };
  private simulate = (): void => { if (!this.state.result) return; simulateResumableTransfer(this.state.result); this.setState({ simulated: true, status: 'Local resumable simulation complete.' }); };
  private uploadSmall = async (): Promise<void> => { if (!this.state.file || !this.state.result) return; this.setState({ busy: true, error: undefined, status: 'Uploading the original small file to SharePoint…' }); try { const receipt = await this.props.uploadAdapter.uploadSmall({ name: this.state.file.name, type: this.state.file.type, data: await this.state.file.arrayBuffer() }); this.setState({ busy: false, uploadedUrl: receipt.url, status: 'Small-file upload complete.' }); } catch (error) { this.setState({ busy: false, error: error instanceof Error ? error.message : String(error), status: 'SharePoint upload failed; no resumable fallback was attempted.' }); } };
}
