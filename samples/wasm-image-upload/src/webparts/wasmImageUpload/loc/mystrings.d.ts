declare interface IWasmImageUploadWebPartStrings {
  PropertyPaneDescription: string;
  BasicGroupName: string;
  DescriptionFieldLabel: string;
  wasmWorkerFailed: string;
  wasmWorkerStartup: string;
  workerFailed: string;
  [key: string]: string;
}

declare module 'WasmImageUploadWebPartStrings' {
  const strings: IWasmImageUploadWebPartStrings;
  export = strings;
}
