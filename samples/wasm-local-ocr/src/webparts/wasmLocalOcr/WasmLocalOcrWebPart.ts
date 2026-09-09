import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Version } from '@microsoft/sp-core-library';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import { type IPropertyPaneConfiguration, PropertyPaneTextField } from '@microsoft/sp-property-pane';
import * as strings from 'WasmLocalOcrWebPartStrings';
import WasmLocalOcr from './components/WasmLocalOcr';

export interface IWasmLocalOcrWebPartProps { description: string; }
export default class WasmLocalOcrWebPart extends BaseClientSideWebPart<IWasmLocalOcrWebPartProps> {
  public render(): void { ReactDom.render(React.createElement(WasmLocalOcr, { description: this.properties.description }), this.domElement); }
  protected onDispose(): void { ReactDom.unmountComponentAtNode(this.domElement); }
  protected get dataVersion(): Version { return Version.parse('1.0'); }
  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration { return { pages: [{ header: { description: strings.PropertyPaneDescription }, groups: [{ groupName: strings.BasicGroupName, groupFields: [PropertyPaneTextField('description', { label: strings.DescriptionFieldLabel })] }] }] }; }
}
