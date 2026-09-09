import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Version } from '@microsoft/sp-core-library';
import { type IPropertyPaneConfiguration, PropertyPaneTextField } from '@microsoft/sp-property-pane';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import { SPHttpClient, ISPHttpClientOptions } from '@microsoft/sp-http';

import * as strings from 'WasmImageUploadWebPartStrings';
import WasmImageUpload from './components/WasmImageUpload';
import type { IWasmImageUploadProps } from './components/IWasmImageUploadProps';
import type { IProcessedImage } from './imageProcessing';

export interface IWasmImageUploadWebPartProps {
  description: string;
}

export default class WasmImageUploadWebPart extends BaseClientSideWebPart<IWasmImageUploadWebPartProps> {
  public render(): void {
    const element: React.ReactElement<IWasmImageUploadProps> = React.createElement(WasmImageUpload, {
      uploadFiles: this._uploadFiles
    });
    ReactDom.render(element, this.domElement);
  }

  protected onDispose(): void {
    ReactDom.unmountComponentAtNode(this.domElement);
  }

  protected get dataVersion(): Version {
    return Version.parse('1.0');
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [{
        header: { description: strings.PropertyPaneDescription },
        groups: [{
          groupName: strings.BasicGroupName,
          groupFields: [PropertyPaneTextField('description', { label: strings.DescriptionFieldLabel })]
        }]
      }]
    };
  }

  private readonly _uploadFiles = async (files: IProcessedImage[]): Promise<number> => {
    const site = this.context.pageContext.web;
    const folder = `${site.serverRelativeUrl.replace(/\/$/, '')}/SiteAssets`;
    const uploaded = await Promise.all(files.map(async file => {
      const url = `${site.absoluteUrl}/_api/web/GetFolderByServerRelativeUrl('${this._sharePointPath(folder)}')/Files/add(overwrite=true,url='${this._sharePointPath(file.name)}')`;
      const options: ISPHttpClientOptions = {
        headers: {
          Accept: 'application/json;odata=nometadata',
          'Content-Type': file.type
        },
        body: new Blob([file.data], { type: file.type })
      };
      const response = await this.context.spHttpClient.post(url, SPHttpClient.configurations.v1, options);
      if (!response.ok) {
        throw new Error(`SharePoint upload failed for ${file.name} (${response.status}).`);
      }
      return response.ok;
    }));
    return uploaded.filter(Boolean).length;
  };

  private _sharePointPath(value: string): string {
    return encodeURI(value.replace(/'/g, "''")).replace(/'/g, '%27');
  }
}
