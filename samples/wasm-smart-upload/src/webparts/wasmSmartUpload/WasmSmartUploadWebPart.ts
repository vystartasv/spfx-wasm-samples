import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Version } from '@microsoft/sp-core-library';
import { type IPropertyPaneConfiguration, PropertyPaneTextField } from '@microsoft/sp-property-pane';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import { SPHttpClient, ISPHttpClientOptions } from '@microsoft/sp-http';
import * as strings from 'WasmSmartUploadWebPartStrings';
import WasmSmartUpload from './components/WasmSmartUpload';
import type { IWasmSmartUploadProps } from './components/IWasmSmartUploadProps';
import type { SmallUploadSource, UploadReceipt, IUploadAdapter } from '../../core/smartUpload';

export interface IWasmSmartUploadWebPartProps { description: string; }

export default class WasmSmartUploadWebPart extends BaseClientSideWebPart<IWasmSmartUploadWebPartProps> {
  public render(): void { const element: React.ReactElement<IWasmSmartUploadProps> = React.createElement(WasmSmartUpload, { uploadAdapter: this.adapter }); ReactDom.render(element, this.domElement); }
  protected onDispose(): void { ReactDom.unmountComponentAtNode(this.domElement); }
  protected get dataVersion(): Version { return Version.parse('1.0'); }
  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration { return { pages: [{ header: { description: strings.PropertyPaneDescription }, groups: [{ groupName: strings.BasicGroupName, groupFields: [PropertyPaneTextField('description', { label: strings.DescriptionFieldLabel })] }] }] }; }

  private readonly adapter: IUploadAdapter = { uploadSmall: source => this.uploadSmall(source) };
  private async uploadSmall(source: SmallUploadSource): Promise<UploadReceipt> {
    const site = this.context.pageContext.web;
    const folder = `${site.serverRelativeUrl.replace(/\/$/, '')}/SiteAssets`;
    const url = `${site.absoluteUrl}/_api/web/GetFolderByServerRelativeUrl('${this.encodePath(folder)}')/Files/add(overwrite=true,url='${this.encodePath(source.name)}')`;
    const options: ISPHttpClientOptions = { headers: { Accept: 'application/json;odata=nometadata', 'Content-Type': source.type || 'application/octet-stream' }, body: new Blob([source.data], { type: source.type || 'application/octet-stream' }) };
    const response = await this.context.spHttpClient.post(url, SPHttpClient.configurations.v1, options);
    if (!response.ok) throw new Error(`SharePoint upload failed (${response.status} ${response.statusText}).`);
    const body = await response.json() as { ServerRelativeUrl?: string };
    return { url: body.ServerRelativeUrl || url, bytes: source.data.byteLength, remote: true };
  }
  private encodePath(value: string): string { return encodeURI(value.replace(/'/g, "''")).replace(/'/g, '%27'); }
}
