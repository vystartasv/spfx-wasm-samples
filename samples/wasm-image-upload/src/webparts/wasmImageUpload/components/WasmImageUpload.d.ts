import * as React from 'react';
import type { IWasmImageUploadProps } from './IWasmImageUploadProps';
import { IBenchmarkResult } from '../imageProcessing';
interface IWasmImageUploadState {
    files: File[];
    result?: IBenchmarkResult;
    error?: string;
    status: string;
    isProcessing: boolean;
    isUploading: boolean;
}
export default class WasmImageUpload extends React.Component<IWasmImageUploadProps, IWasmImageUploadState> {
    private readonly _fileInput;
    private _worker?;
    constructor(props: IWasmImageUploadProps);
    componentWillUnmount(): void;
    render(): React.ReactElement<IWasmImageUploadProps>;
    private readonly _onFilesChanged;
    private readonly _optimize;
    private _runWorker;
    private readonly _upload;
}
export {};
//# sourceMappingURL=WasmImageUpload.d.ts.map