import * as React from 'react';
import styles from './WasmImageUpload.module.scss';
import type { IWasmImageUploadProps } from './IWasmImageUploadProps';
import {
  formatBytes,
  IBenchmarkResult,
  IWorkerRequest,
  IWorkerResponse,
  MAX_IMAGE_BYTES,
  selectImageEngine,
  validateImageFiles
} from '../imageProcessing';
import { createImageProcessorWorker } from '../workers/imageProcessor.worker';
import * as strings from 'WasmImageUploadWebPartStrings';

type IWasmWorkerMessage = { ready: true } | IWorkerResponse;
let nextInstanceId = 0;

interface IWasmImageUploadState {
  files: File[];
  result?: IBenchmarkResult;
  error?: string;
  status: string;
  isProcessing: boolean;
  isUploading: boolean;
}

export default class WasmImageUpload extends React.Component<IWasmImageUploadProps, IWasmImageUploadState> {
  private readonly ids = `wasm-image-${++nextInstanceId}`;
  private readonly _fileInput = React.createRef<HTMLInputElement>();
  private _worker?: Worker;

  public constructor(props: IWasmImageUploadProps) {
    super(props);
    this.state = {
      files: [],
      status: strings.initialStatus,
      isProcessing: false,
      isUploading: false
    };
  }

  public componentWillUnmount(): void {
    this._worker?.terminate();
  }

  public render(): React.ReactElement<IWasmImageUploadProps> {
    const { files, result, error, status, isProcessing, isUploading } = this.state;
    const originalBytes = files.reduce((total, file) => total + file.size, 0);

    return (
      <section className={styles.wasmImageUpload} aria-labelledby={`${this.ids}-heading`}>
        <h2 id={`${this.ids}-heading`}>{strings.title}</h2>
        <p className={styles.intro}>
          {strings.intro}
        </p>

        <div className={styles.controls}>
          <label htmlFor={`${this.ids}-file-input`}>{strings.chooseFiles}</label>
          <input
            ref={this._fileInput}
            id={`${this.ids}-file-input`}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
            multiple={true}
            onChange={this._onFilesChanged}
          />
          <p className={styles.hint}>{strings.fileHint.replace('{0}', formatBytes(MAX_IMAGE_BYTES))}</p>
        </div>

        <div className={styles.status} role="status" aria-live="polite" aria-atomic="true">{status}</div>
        {error && <div className={styles.error} role="alert">{error}</div>}

        {files.length > 0 && (
          <div className={styles.selection}>
            <h3>{strings.selection}</h3>
            <p>{strings.fileCount.replace('{0}', String(files.length)).replace('{1}', files.length === 1 ? '' : 's').replace('{2}', formatBytes(originalBytes))}</p>
            <ul>
              {files.map(file => <li key={`${file.name}-${file.lastModified}`}>{file.name} ({formatBytes(file.size)})</li>)}
            </ul>
            <button type="button" onClick={this._optimize} disabled={isProcessing}>
              {isProcessing ? strings.optimizing : strings.optimize}
            </button>
          </div>
        )}

        {result && (
          <div className={styles.results} aria-labelledby={`${this.ids}-results-heading`}>
            <h3 id={`${this.ids}-results-heading`}>{strings.measuredResult}</h3>
            <dl>
              <div><dt>{strings.engine}</dt><dd>{result.engine}</dd></div>
              <div><dt>{strings.originalTotal}</dt><dd>{formatBytes(result.originalBytes)}</dd></div>
              <div><dt>{strings.optimizedTotal}</dt><dd>{formatBytes(result.optimizedBytes)}</dd></div>
              <div><dt>{strings.bytesSaved}</dt><dd>{formatBytes(Math.abs(result.bytesSaved))}{result.bytesSaved < 0 ? strings.increase : ''}</dd></div>
              <div><dt>{strings.percentageSaved}</dt><dd>{result.percentageSaved}%</dd></div>
              <div><dt>{strings.processingDuration}</dt><dd>{result.durationMs.toFixed(2)} ms</dd></div>
            </dl>
            {!result.orientationAware && <p className={styles.warning}>{strings.orientationWarning}</p>}
            {result.warnings.map(warning => <p className={styles.warning} key={warning}>{warning}</p>)}
            <button type="button" onClick={this._upload} disabled={isUploading}>
              {isUploading ? strings.uploading : strings.upload}
            </button>
            <p className={styles.hint}>{strings.uploadHint}</p>
          </div>
        )}
      </section>
    );
  }

  private readonly _onFilesChanged = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const files = Array.prototype.slice.call(event.target.files || []) as File[];
    const errors = validateImageFiles(files);
    this.setState({
      files: errors.length === 0 ? files : [],
      result: undefined,
      error: errors.length > 0 ? errors.join(' ') : undefined,
      status: errors.length > 0 ? strings.selectionAttention : strings.filesSelected.replace('{0}', String(files.length)).replace('{1}', files.length === 1 ? '' : 's')
    });
  };

  private readonly _optimize = async (): Promise<void> => {
    if (this.state.files.length === 0) {
      return;
    }

    this.setState({ isProcessing: true, error: undefined, status: strings.reading, result: undefined });
    try {
      if (typeof Worker === 'undefined') {
        throw new Error(strings.noWorkers);
      }

      const inputFiles: IWorkerRequest['files'] = [];
      for (const file of this.state.files) {
        inputFiles.push({ name: file.name, type: file.type, bytes: file.size, data: await file.arrayBuffer() });
      }
      const result = await this._runWorkers({ files: inputFiles, maxDimension: 2048, quality: 0.82 });
      this.setState({ result, isProcessing: false, status: strings.complete });
    } catch (processingError) {
      const message = processingError instanceof Error ? processingError.message : strings.processingFailed;
      this.setState({ isProcessing: false, error: message, status: strings.failed });
    }
  };

  private async _runWorkers(request: IWorkerRequest): Promise<IBenchmarkResult> {
    const nativeRequest: IWorkerRequest = {
      ...request,
      files: request.files.map(file => ({ ...file, data: file.data.slice(0) }))
    };

    try {
      const { createWasmImageProcessorWorker } = await import(
        /* webpackChunkName: "wasm-image-processor" */ '../workers/wasmImageProcessor.worker.factory'
      );
      return await this._runWasmWorker(createWasmImageProcessorWorker, request, request.files.map(file => file.data));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const selection = selectImageEngine(false, `WASM worker unavailable (${message}); used browser-native encoding.`);
      return this._runWorker({ ...nativeRequest, warnings: selection.warnings }, nativeRequest.files.map(file => file.data));
    }
  }

  private _runWasmWorker(
    createWorker: () => Worker,
    request: IWorkerRequest,
    transfer: ArrayBuffer[]
  ): Promise<IBenchmarkResult> {
    return new Promise<IBenchmarkResult>((resolve, reject) => {
      let worker: Worker;
      try {
        // This module is lazy; all image work still starts only after the worker handshake.
        worker = createWorker();
        this._worker = worker;
      } catch (error) {
        reject(new Error(`${strings.wasmWorkerStartup} ${String(error)}`));
        return;
      }

      worker.onmessage = (event: MessageEvent<IWasmWorkerMessage>) => {
        if ('ready' in event.data) {
          worker.postMessage(request, transfer);
          return;
        }
        worker.terminate();
        this._worker = undefined;
        if (event.data.ok) {
          resolve(event.data.result);
        } else {
          reject(new Error(event.data.error));
        }
      };
      worker.onerror = event => {
        worker.terminate();
        this._worker = undefined;
        reject(new Error(event.message || strings.wasmWorkerFailed));
      };
    });
  }

  private _runWorker(request: IWorkerRequest, transfer: ArrayBuffer[]): Promise<IBenchmarkResult> {
    return new Promise<IBenchmarkResult>((resolve, reject) => {
      try {
        this._worker = createImageProcessorWorker();
      } catch (error) {
        reject(new Error(`The image worker could not be started: ${String(error)}`));
        return;
      }

      const worker = this._worker;
      worker.onmessage = (event: MessageEvent<IWorkerResponse>) => {
        worker.terminate();
        this._worker = undefined;
        if (event.data.ok) {
          resolve(event.data.result);
        } else {
          reject(new Error(event.data.error));
        }
      };
      worker.onerror = event => {
        worker.terminate();
        this._worker = undefined;
        reject(new Error(event.message || strings.workerFailed));
      };
      worker.postMessage(request, transfer);
    });
  }

  private readonly _upload = async (): Promise<void> => {
    if (!this.state.result) {
      return;
    }

    this.setState({ isUploading: true, error: undefined, status: strings.uploadingStatus });
    try {
      const count = await this.props.uploadFiles(this.state.result.files);
      this.setState({ isUploading: false, status: strings.uploaded.replace('{0}', String(count)).replace('{1}', count === 1 ? '' : 's') });
    } catch (uploadError) {
      const message = uploadError instanceof Error ? uploadError.message : strings.sharePointFailed;
      this.setState({ isUploading: false, error: message, status: strings.uploadFailed });
    }
  };
}
