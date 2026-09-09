export declare const MAX_IMAGE_FILES = 20;
export declare const MAX_IMAGE_BYTES: number;
export type ImageEngine = 'Browser-native worker';
export interface IProcessedImage {
    name: string;
    type: string;
    bytes: number;
    data: ArrayBuffer;
}
export interface IBenchmarkResult {
    engine: ImageEngine;
    originalBytes: number;
    optimizedBytes: number;
    bytesSaved: number;
    percentageSaved: number;
    durationMs: number;
    orientationAware: boolean;
    warnings: string[];
    files: IProcessedImage[];
}
export interface IWorkerInputFile {
    name: string;
    type: string;
    bytes: number;
    data: ArrayBuffer;
}
export interface IWorkerRequest {
    files: IWorkerInputFile[];
    maxDimension: number;
    quality: number;
}
export type IWorkerResponse = {
    ok: true;
    result: IBenchmarkResult;
} | {
    ok: false;
    error: string;
};
export declare function formatBytes(bytes: number): string;
export declare function calculatePercentageSaved(originalBytes: number, optimizedBytes: number): number;
export declare function shapeBenchmarkResult(originalBytes: number, optimizedBytes: number, durationMs: number, engine: ImageEngine, files: IProcessedImage[], orientationAware: boolean, warnings?: string[]): IBenchmarkResult;
export declare function validateImageFiles(files: ReadonlyArray<Pick<File, 'name' | 'size' | 'type'>>): string[];
export declare function optimizedFileName(name: string): string;
//# sourceMappingURL=imageProcessing.d.ts.map