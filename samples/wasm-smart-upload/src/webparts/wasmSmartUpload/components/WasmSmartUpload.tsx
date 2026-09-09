import * as React from 'react';
import styles from './WasmSmartUpload.module.scss';
import type { IWasmSmartUploadProps } from './IWasmSmartUploadProps';
import { canPublishPrepareResult, createFixture, DEFAULT_CHUNK_SIZE, prepareUpload, PrepareRequest, PrepareResponse, PrepareResult, RPC_VERSION, SMALL_UPLOAD_MAX_BYTES, simulateResumableTransfer, validateUpload } from '../../../core/smartUpload';
import { createSmartUploadWorker } from '../workers/smartUpload.worker.factory';
import * as strings from 'WasmSmartUploadWebPartStrings';

interface State { file?: File; result?: PrepareResult; chunkSize: number; status: string; error?: string; warning?: string; busy: boolean; simulated: boolean; uploadedUrl?: string; }
let nextInstanceId = 0;

export default class WasmSmartUpload extends React.Component<IWasmSmartUploadProps, State> {
  private readonly ids = `smart-upload-${++nextInstanceId}`;
  private readonly input = React.createRef<HTMLInputElement>();
  private worker?: Worker;
  private requestId?: string;
  private cancelPending?: (error: Error) => void;
  private readonly cancelled = new Set<string>();
  public state: State = { chunkSize: DEFAULT_CHUNK_SIZE, status: strings.initial, busy: false, simulated: false };

  public componentWillUnmount(): void { this.worker?.terminate(); }

  public render(): React.ReactElement {
    const { file, result, busy } = this.state;
    return <section className={styles.root} aria-labelledby={`${this.ids}-title`}>
      <h2 id={`${this.ids}-title`}>{strings.title}</h2>
      <p>{strings.description}</p>
      <div className={styles.dropZone} onDragOver={this.onDragOver} onDrop={this.onDrop}>
        <label htmlFor={`${this.ids}-file`}>{strings.choose}</label>
        <input ref={this.input} id={`${this.ids}-file`} type="file" onChange={this.onChange} disabled={busy} />
        <p className={styles.hint}>{strings.drop.replace('{0}', '512')}</p>
        {file && <p><strong>{file.name}</strong> · {file.size.toLocaleString()} {strings.bytes}</p>}
      </div>
      <div className={styles.toolbar} aria-label={strings.controls}>
        <label htmlFor={`${this.ids}-chunk-size`}>{strings.chunk}<select id={`${this.ids}-chunk-size`} value={this.state.chunkSize} onChange={this.onChunkSize} disabled={busy}>
          {[256, 512, 1024, 4096, 8192, 16384].map(value => <option key={value} value={value * 1024}>{value >= 1024 ? `${value / 1024} ${strings.megabytes}` : `${value} ${strings.kilobytes}`}</option>)}
        </select></label>
        <button type="button" onClick={this.prepare} disabled={busy || !file}>{busy ? strings.preparing : strings.prepare}</button>
        <button type="button" onClick={this.fixture} disabled={busy}>{strings.fixture}</button>
        <button type="button" onClick={this.cancel} disabled={!busy}>{strings.cancel}</button>
        <button type="button" onClick={this.reset} disabled={busy}>{strings.reset}</button>
      </div>
      <div className={styles.status} role="status" aria-live="polite" aria-atomic="true">{this.state.status}</div>
      {this.state.error && <p className={styles.error} role="alert">{this.state.error}</p>}
      {this.state.warning && <p className={styles.warning} role="status">{this.state.warning}</p>}
      <div className={styles.boundary}><strong>{strings.boundaryTitle}</strong> {strings.boundary.replace('{0}', String(SMALL_UPLOAD_MAX_BYTES / 1024 / 1024))}</div>
      {result && <div className={styles.results} aria-labelledby={`${this.ids}-results-title`}>
        <h3 id={`${this.ids}-results-title`}>{strings.result}</h3>
        <dl><dt>{strings.engine}</dt><dd>{result.engine}</dd><dt>{strings.hash}</dt><dd><code>{result.fileHash}</code></dd><dt>{strings.count}</dt><dd>{result.chunkCount}</dd><dt>{strings.size}</dt><dd>{result.chunkSize.toLocaleString()} {strings.bytes}</dd><dt>{strings.hashing}</dt><dd>{result.hashingMs.toFixed(2)} ms</dd><dt>{strings.chunking}</dt><dd>{result.chunkingMs.toFixed(2)} ms</dd><dt>{strings.total}</dt><dd>{result.totalMs.toFixed(2)} ms</dd></dl>
        <p>{strings.identity} <code>{result.chunks[0]?.identity || strings.empty}</code></p>
        {result.warnings.map(warning => <p className={styles.warning} key={warning}>{warning}</p>)}
        <button type="button" onClick={this.simulate} disabled={busy}>{strings.simulate}</button>
        {file && file.size <= SMALL_UPLOAD_MAX_BYTES && <button type="button" onClick={this.uploadSmall} disabled={busy}>{strings.upload}</button>}
        {this.state.simulated && <p role="status">{strings.simulated.replace('{0}', String(result.chunkCount))}</p>}
        {this.state.uploadedUrl && <p role="status">{strings.uploaded} <code>{this.state.uploadedUrl}</code>.</p>}
      </div>}
    </section>;
  }

  private onDragOver = (event: React.DragEvent<HTMLDivElement>): void => { event.preventDefault(); };
  private onDrop = (event: React.DragEvent<HTMLDivElement>): void => { event.preventDefault(); this.select(event.dataTransfer.files[0]); };
  private onChange = (event: React.ChangeEvent<HTMLInputElement>): void => { this.select(event.target.files?.[0]); };
  private select = (file?: File): void => { const errors = validateUpload(file && { name: file.name, size: file.size }, this.state.chunkSize); this.setState({ file: errors.length ? undefined : file, result: undefined, error: errors.length ? errors.join(' ') : undefined, uploadedUrl: undefined, simulated: false, status: errors.length ? strings.attention : strings.selected.replace('{0}', file?.name || '') }); };
  private onChunkSize = (event: React.ChangeEvent<HTMLSelectElement>): void => this.setState({ chunkSize: Number(event.target.value), result: undefined });
  private fixture = async (): Promise<void> => this.run(undefined, true);
  private prepare = async (): Promise<void> => this.run(this.state.file, false);
  private run = async (file: File | undefined, fixture: boolean): Promise<void> => {
    const input = fixture ? undefined : file;
    if (!fixture && !input) return;
    this.setState({ busy: true, result: undefined, error: undefined, warning: undefined, simulated: false, uploadedUrl: undefined, status: strings.reading });
    try {
      const value = fixture ? undefined : { name: input!.name, type: input!.type, size: input!.size, data: await input!.arrayBuffer() };
      const result = await this.workerPrepare({ version: RPC_VERSION, id: `prepare-${Date.now()}`, method: 'prepare', fixture, input: value, chunkSize: this.state.chunkSize });
      this.setState({ busy: false, result, status: strings.complete });
    } catch (error) {
      const shaped = error as { code?: string; message?: string };
      if (shaped.code === 'CANCELLED') this.setState({ busy: false, status: strings.cancelled });
      else this.setState({ busy: false, error: shaped.message || String(error), status: strings.failed });
    }
  };
  private workerPrepare = (request: PrepareRequest): Promise<PrepareResult> => new Promise((resolve, reject) => {
    this.cancelPending = reject;
    if (typeof Worker === 'undefined') { this.setState({ warning: strings.workerUnavailable }); this.nativePrepare(request, resolve, reject); return; }
    let worker: Worker;
    try { worker = createSmartUploadWorker(); this.worker = worker; } catch (error) { this.setState({ warning: strings.workerStartup.replace('{0}', String(error)) }); this.nativePrepare(request, resolve, reject); return; }
    const fallbackRequest = request.input ? { ...request, input: { ...request.input, data: request.input.data.slice(0) } } : request;
    this.requestId = request.id;
    worker.onmessage = (event: MessageEvent<PrepareResponse>) => {
      worker.terminate(); this.worker = undefined; this.requestId = undefined; this.cancelPending = undefined;
      if (event.data.ok) { resolve(event.data.result!); return; }
      if (event.data.error?.code === 'WORKER_ERROR' || event.data.error?.code === 'CRYPTO_UNAVAILABLE') { this.setState({ warning: strings.workerReported.replace('{0}', event.data.error.code) }); this.nativePrepare(fallbackRequest, resolve, reject, event.data.error.message); return; }
      reject(Object.assign(new Error(event.data.error?.message), event.data.error));
    };
    worker.onerror = event => { worker.terminate(); this.worker = undefined; this.requestId = undefined; this.cancelPending = undefined; this.nativePrepare(fallbackRequest, resolve, reject, event.message || strings.workerFailed); };
    const transfer = request.input ? [request.input.data] : [];
    worker.postMessage(request, transfer);
  });
  private nativePrepare = (request: PrepareRequest, resolve: (result: PrepareResult) => void, reject: (error: Error) => void, warning?: string): void => {
    const input = request.fixture ? createFixture() : request.input;
    if (!input) { reject(Object.assign(new Error(strings.fileRequired), { code: 'INVALID_INPUT' })); return; }
    prepareUpload(input, request.chunkSize, () => this.cancelled.has(request.id)).then(result => { if (!canPublishPrepareResult(this.cancelled, request.id)) { reject(Object.assign(new Error('Preparation cancelled.'), { code: 'CANCELLED' })); return; } if (warning) result.warnings.push(`Worker fallback: ${warning}`); resolve(result); }, reject);
  };
  private cancel = (): void => { const id = this.requestId; if (id) this.cancelled.add(id); this.worker?.terminate(); this.worker = undefined; this.requestId = undefined; this.cancelPending?.(Object.assign(new Error('Preparation cancelled.'), { code: 'CANCELLED' })); this.cancelPending = undefined; this.setState({ busy: false, status: strings.cancelled }); };
  private reset = (): void => { this.worker?.terminate(); this.worker = undefined; if (this.input.current) this.input.current.value = ''; this.setState({ file: undefined, result: undefined, error: undefined, warning: undefined, simulated: false, uploadedUrl: undefined, busy: false, status: strings.initial }); };
  private simulate = (): void => { if (!this.state.result) return; simulateResumableTransfer(this.state.result); this.setState({ simulated: true, status: strings.simulationComplete }); };
  private uploadSmall = async (): Promise<void> => { if (!this.state.file || !this.state.result) return; this.setState({ busy: true, error: undefined, status: strings.uploadStatus }); try { const receipt = await this.props.uploadAdapter.uploadSmall({ name: this.state.file.name, type: this.state.file.type, data: await this.state.file.arrayBuffer() }); this.setState({ busy: false, uploadedUrl: receipt.url, status: strings.uploadComplete }); } catch (error) { this.setState({ busy: false, error: error instanceof Error ? error.message : String(error), status: strings.uploadFailed }); } };
}
