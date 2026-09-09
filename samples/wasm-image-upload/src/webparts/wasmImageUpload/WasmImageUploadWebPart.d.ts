import { Version } from '@microsoft/sp-core-library';
import { type IPropertyPaneConfiguration } from '@microsoft/sp-property-pane';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
export interface IWasmImageUploadWebPartProps {
    description: string;
}
export default class WasmImageUploadWebPart extends BaseClientSideWebPart<IWasmImageUploadWebPartProps> {
    render(): void;
    protected onDispose(): void;
    protected get dataVersion(): Version;
    protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration;
    private readonly _uploadFiles;
    private _sharePointPath;
}
//# sourceMappingURL=WasmImageUploadWebPart.d.ts.map