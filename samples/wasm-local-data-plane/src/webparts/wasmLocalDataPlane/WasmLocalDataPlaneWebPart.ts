import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Version } from '@microsoft/sp-core-library';
import { type IPropertyPaneConfiguration, PropertyPaneTextField } from '@microsoft/sp-property-pane';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import * as strings from 'WasmLocalDataPlaneWebPartStrings';
import LocalDataPlane from './components/LocalDataPlane';
import type { Namespace } from '../../core/types';

export interface IWasmLocalDataPlaneWebPartProps { description: string; }
export default class WasmLocalDataPlaneWebPart extends BaseClientSideWebPart<IWasmLocalDataPlaneWebPartProps> {
  public render(): void { const namespace: Namespace = { tenantId: this.context.pageContext.aadInfo?.tenantId || 'unknown-tenant', userObjectId: this.context.pageContext.aadInfo?.userId || 'unknown-user', applicationId: 'wasm-local-data-plane-m1' }; ReactDom.render(React.createElement(LocalDataPlane, { namespace }), this.domElement); }
  protected onDispose(): void { ReactDom.unmountComponentAtNode(this.domElement); }
  protected get dataVersion(): Version { return Version.parse('1.0'); }
  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration { return { pages: [{ header: { description: strings.PropertyPaneDescription }, groups: [{ groupName: strings.BasicGroupName, groupFields: [PropertyPaneTextField('description', { label: strings.DescriptionFieldLabel })] }] }] }; }
}
