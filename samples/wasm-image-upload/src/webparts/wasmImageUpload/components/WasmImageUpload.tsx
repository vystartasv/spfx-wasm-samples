import * as React from 'react';
import styles from './WasmImageUpload.module.scss';
import type { IWasmImageUploadProps } from './IWasmImageUploadProps';
import {
  formatBytes,
  IBenchmarkResult,
  IWorkerRequest,
  IWorkerResponse,
  MAX_IMAGE_BYTES,
  validateImageFiles
} from '../imageProcessing';
import { createImageProcessorWorker } from '../workers/imageProcessor.worker';

interface IWasmImageUploadState {
  files: File[];
  result?: IBenchmarkResult;
  error?: string;
  status: string;
  isProcessing: boolean;
  isUploading: boolean;
}

export default class WasmImageUpload extends React.Component<IWasmImageUploadProps, IWasmImageUploadState> {
  private readonly _fileInput = React.createRef<HTMLInputElement>();
  private _worker?: Worker;

  public constructor(props: IWasmImageUploadProps) {
    super(props);
    this.state = {
      files: [],
      status: 'Select one or more local image files to begin.',
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
      <section className={styles.wasmImageUpload} aria-labelledby="wasm-image-upload-heading">
        <h2 id="wasm-image-upload-heading">WASM image upload sample</h2>
        <p className={styles.intro}>
          Images are optimized locally in a worker. Nothing is uploaded until you explicitly choose the upload action.
        </p>

        <div className={styles.controls}>
          <label htmlFor="wasm-image-file-input">Choose image files</label>
          <input
            ref={this._fileInput}
            id="wasm-image-file-input"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
            multiple={true}
            onChange={this._onFilesChanged}
          />
          <p className={styles.hint}>Up to 20 files, with each file up to {formatBytes(MAX_IMAGE_BYTES)}.</p>
        </div>

        <div className={styles.status} role="status" aria-live="polite" aria-atomic="true">{status}</div>
        {error && <div className={styles.error} role="alert">{error}</div>}

        {files.length > 0 && (
          <div className={styles.selection}>
            <h3>Selection</h3>
            <p>{files.length} file{files.length === 1 ? '' : 's'} · {formatBytes(originalBytes)} original total</p>
            <ul>
              {files.map(file => <li key={`${file.name}-${file.lastModified}`}>{file.name} ({formatBytes(file.size)})</li>)}
            </ul>
            <button type="button" onClick={this._optimize} disabled={isProcessing}>
              {isProcessing ? 'Optimizing…' : 'Optimize locally'}
            </button>
          </div>
        )}

        {result && (
          <div className={styles.results} aria-labelledby="wasm-image-results-heading">
            <h3 id="wasm-image-results-heading">Measured result</h3>
            <dl>
              <div><dt>Engine</dt><dd>{result.engine}</dd></div>
              <div><dt>Optimized total</dt><dd>{formatBytes(result.optimizedBytes)}</dd></div>
              <div><dt>Bytes saved</dt><dd>{formatBytes(Math.abs(result.bytesSaved))}{result.bytesSaved < 0 ? ' increase' : ''}</dd></div>
              <div><dt>Percentage saved</dt><dd>{result.percentageSaved}%</dd></div>
              <div><dt>Processing duration</dt><dd>{result.durationMs.toFixed(2)} ms</dd></div>
            </dl>
            {!result.orientationAware && <p className={styles.warning}>The browser could not apply EXIF orientation metadata during decode.</p>}
            {result.warnings.map(warning => <p className={styles.warning} key={warning}>{warning}</p>)}
            <button type="button" onClick={this._upload} disabled={isUploading}>
              {isUploading ? 'Uploading…' : 'Upload optimized files to SharePoint'}
            </button>
            <p className={styles.hint}>Upload is explicit and targets this site’s Site Assets library.</p>
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
      status: errors.length > 0 ? 'Selection needs attention.' : `${files.length} image file${files.length === 1 ? '' : 's'} selected.`
    });
  };

  private readonly _optimize = async (): Promise<void> => {
    if (this.state.files.length === 0) {
      return;
    }

    this.setState({ isProcessing: true, error: undefined, status: 'Reading files and starting the worker…', result: undefined });
    try {
      if (typeof Worker === 'undefined') {
        throw new Error('This browser does not provide Web Workers. Processing cannot start without blocking the page.');
      }

      const inputFiles: IWorkerRequest['files'] = await Promise.all(this.state.files.map(async file => ({
        name: file.name,
        type: file.type,
        bytes: file.size,
        data: await file.arrayBuffer()
      })));
      const transfer = inputFiles.map(file => file.data);
      const result = await this._runWorker({ files: inputFiles, maxDimension: 2048, quality: 0.82 }, transfer);
      this.setState({ result, isProcessing: false, status: 'Optimization complete. Values below came from this run.' });
    } catch (processingError) {
      const message = processingError instanceof Error ? processingError.message : 'Image processing failed.';
      this.setState({ isProcessing: false, error: message, status: 'Optimization could not be completed.' });
    }
  };

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
        reject(new Error(event.message || 'The image worker failed.'));
      };
      worker.postMessage(request, transfer);
    });
  }

  private readonly _upload = async (): Promise<void> => {
    if (!this.state.result) {
      return;
    }

    this.setState({ isUploading: true, error: undefined, status: 'Uploading optimized files to this SharePoint site…' });
    try {
      const count = await this.props.uploadFiles(this.state.result.files);
      this.setState({ isUploading: false, status: `${count} optimized file${count === 1 ? '' : 's'} uploaded to Site Assets.` });
    } catch (uploadError) {
      const message = uploadError instanceof Error ? uploadError.message : 'SharePoint upload failed.';
      this.setState({ isUploading: false, error: message, status: 'Upload could not be completed.' });
    }
  };
}
