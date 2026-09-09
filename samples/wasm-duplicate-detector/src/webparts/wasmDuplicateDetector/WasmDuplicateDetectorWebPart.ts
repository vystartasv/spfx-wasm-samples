import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Version } from '@microsoft/sp-core-library';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import { type IPropertyPaneConfiguration, PropertyPaneTextField } from '@microsoft/sp-property-pane';
import * as strings from 'WasmDuplicateDetectorWebPartStrings';
import WasmDuplicateDetector from './components/WasmDuplicateDetector';
export interface IWasmDuplicateDetectorWebPartProps { description: string; }
export default class WasmDuplicateDetectorWebPart extends BaseClientSideWebPart<IWasmDuplicateDetectorWebPartProps> { public render(): void { ReactDom.render(React.createElement(WasmDuplicateDetector, { description: this.properties.description }), this.domElement); } protected onDispose(): void { ReactDom.unmountComponentAtNode(this.domElement); } protected get dataVersion(): Version { return Version.parse('1.0'); } protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration { return { pages: [{ header: { description: strings.PropertyPaneDescription }, groups: [{ groupName: strings.BasicGroupName, groupFields: [PropertyPaneTextField('description', { label: strings.DescriptionFieldLabel })] }] }] }; } }
