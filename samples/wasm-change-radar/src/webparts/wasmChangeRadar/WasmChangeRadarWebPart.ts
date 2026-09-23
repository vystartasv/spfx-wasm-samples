import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Version } from '@microsoft/sp-core-library';
import { type IPropertyPaneConfiguration, PropertyPaneTextField } from '@microsoft/sp-property-pane';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import * as strings from 'WasmChangeRadarWebPartStrings';
import WasmChangeRadar from './components/WasmChangeRadar';
import { createUnavailableSharePointAdapter } from '../../sharepoint/readOnlySharePointAdapter';

export interface IWasmChangeRadarWebPartProps { description: string; }

export default class WasmChangeRadarWebPart extends BaseClientSideWebPart<IWasmChangeRadarWebPartProps> {
  private readonly readOnlyAdapter = createUnavailableSharePointAdapter();

  public render(): void {
    ReactDom.render(React.createElement(WasmChangeRadar, {
      description: this.properties.description,
      siteUrl: this.context.pageContext.web.absoluteUrl,
      readCurrentSitePages: (siteUrl, pageLimit) => this.readOnlyAdapter.loadPages(siteUrl, pageLimit)
    }), this.domElement);
  }

  protected onDispose(): void { ReactDom.unmountComponentAtNode(this.domElement); }
  protected get dataVersion(): Version { return Version.parse('1.0'); }
  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return { pages: [{ header: { description: strings.PropertyPaneDescription }, groups: [{ groupName: strings.BasicGroupName, groupFields: [PropertyPaneTextField('description', { label: strings.DescriptionFieldLabel })] }] }] };
  }
}
