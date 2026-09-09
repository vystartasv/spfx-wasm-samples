import type { IProcessedImage } from '../imageProcessing';

export interface IWasmImageUploadProps {
  uploadFiles: (files: IProcessedImage[]) => Promise<number>;
}
