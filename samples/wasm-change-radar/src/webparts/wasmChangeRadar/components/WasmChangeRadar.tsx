import * as React from 'react';
import { AnalysisResult, exportReport, MAX_CONTENT_CHARS, MAX_PAGE_REQUESTS, MAX_PAGES, ProposedAction, ScopeMode, validateAnalysisInput, validateSameSiteUrl } from '../../../core/changeRadar';
import { ChangeRadarClient } from '../client';
import styles from './WasmChangeRadar.module.scss';
import type { IWasmChangeRadarProps } from './IWasmChangeRadarProps';
import * as strings from 'WasmChangeRadarWebPartStrings';

interface State {
  scope: ScopeMode;
  siteUrl: string;
  targetUrl: string;
  action: ProposedAction;
  replacementUrl: string;
  result?: AnalysisResult;
  busy: boolean;
  status: string;
  error?: string;
  adapterWarnings: string[];
}

let nextInstanceId = 0;
const targetOptions = ['SitePages/Legacy.aspx', 'SitePages/Home.aspx', 'SitePages/Overview.aspx'];
const replace = (value: string, ...values: string[]): string => values.reduce((text, item, index) => text.replace(`{${index}}`, item), value);

export default class WasmChangeRadar extends React.Component<IWasmChangeRadarProps, State> {
  private readonly ids = `change-radar-${++nextInstanceId}`;
  private readonly client = new ChangeRadarClient();

  public state: State = { scope: 'demo', siteUrl: this.props.siteUrl || 'https://contoso.sharepoint.com/sites/demo', targetUrl: targetOptions[0], action: 'retire', replacementUrl: '', busy: false, status: strings.initial, adapterWarnings: [] };

  public componentWillUnmount(): void { this.client.dispose(); }

  private scan = async (): Promise<void> => {
    const input = { scope: this.state.scope, siteUrl: this.state.siteUrl, targetUrl: this.state.targetUrl, action: this.state.action, replacementUrl: this.state.replacementUrl };
    const errors = validateAnalysisInput(input);
    if (errors.length) { this.setState({ error: errors.join(' '), status: strings.validation }); return; }
    this.setState({ busy: true, error: undefined, result: undefined, adapterWarnings: [], status: strings.scanning });
    try {
      let pages;
      let adapterWarnings: string[] = [];
      if (this.state.scope === 'current-site') {
        const loaded = await this.props.readCurrentSitePages(this.state.siteUrl, MAX_PAGES);
        pages = loaded.pages; adapterWarnings = loaded.warnings;
      }
      const result = await this.client.analyze({ ...input, pages });
      this.setState({ result, busy: false, adapterWarnings, status: replace(strings.complete, String(result.impacts.length)) });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.setState({ busy: false, error: message.includes('cancelled') ? undefined : message, status: message.includes('cancelled') ? strings.cancelled : strings.failed });
    }
  };

  private cancel = (): void => { this.client.cancel(); this.setState({ busy: false, status: strings.cancelled }); };
  private clear = (): void => this.setState({ result: undefined, error: undefined, adapterWarnings: [], busy: false, status: strings.initial });
  private download = (): void => {
    if (!this.state.result) return;
    const blob = new Blob([exportReport(this.state.result)], { type: 'application/json' });
    const url = URL.createObjectURL(blob); const link = document.createElement('a');
    link.href = url; link.download = 'sharepoint-change-radar.json'; link.click(); URL.revokeObjectURL(url);
  };

  private renderInputValidation(value: string): React.ReactNode {
    if (!value) return null;
    const check = validateSameSiteUrl(this.state.siteUrl, value);
    return check.valid ? null : <span className={styles.error} role="alert">{check.reason}</span>;
  }

  public render(): React.ReactElement {
    const { result } = this.state;
    const isCustomTarget = targetOptions.indexOf(this.state.targetUrl) < 0;
    return <section className={styles.root} aria-labelledby={`${this.ids}-title`}>
      <h2 id={`${this.ids}-title`}>{strings.title}</h2>
      <p className={styles.intro}>{strings.description}</p>
      <p className={styles.limits}>{replace(strings.limits, String(MAX_PAGES), String(MAX_CONTENT_CHARS / 1024), String(MAX_PAGE_REQUESTS))}</p>
      <div className={styles.controls} aria-label={strings.controls}>
        <fieldset>
          <legend>{strings.scope}</legend>
          <div className={styles.radioGroup}>
            <label><input type="radio" name={`${this.ids}-scope`} checked={this.state.scope === 'demo'} onChange={() => this.setState({ scope: 'demo' })} disabled={this.state.busy} />{strings.demoScope}</label>
            <label><input type="radio" name={`${this.ids}-scope`} checked={this.state.scope === 'current-site'} onChange={() => this.setState({ scope: 'current-site' })} disabled={this.state.busy} />{strings.currentSiteScope}</label>
          </div>
        </fieldset>
        <label className={styles.field}><span>{strings.siteUrl}</span><input value={this.state.siteUrl} onChange={event => this.setState({ siteUrl: event.target.value })} disabled={this.state.busy || this.state.scope === 'current-site'} aria-describedby={`${this.ids}-site-hint`} /> <span className={styles.hint} id={`${this.ids}-site-hint`}>{this.state.scope === 'current-site' ? strings.currentSiteHint : strings.siteHint}</span>{this.renderInputValidation(this.state.siteUrl)}</label>
        <label className={styles.field}><span>{strings.target}</span><select value={isCustomTarget ? 'custom' : this.state.targetUrl} onChange={event => event.target.value !== 'custom' && this.setState({ targetUrl: event.target.value })} disabled={this.state.busy}><option value={targetOptions[0]}>{strings.targetLegacy}</option><option value={targetOptions[1]}>{strings.targetHome}</option><option value={targetOptions[2]}>{strings.targetOverview}</option><option value="custom">{strings.targetCustom}</option></select></label>
        {isCustomTarget && <label className={styles.field}><span>{strings.targetUrl}</span><input value={this.state.targetUrl} onChange={event => this.setState({ targetUrl: event.target.value })} disabled={this.state.busy} aria-describedby={`${this.ids}-target-hint`} />{this.renderInputValidation(this.state.targetUrl)}<span className={styles.hint} id={`${this.ids}-target-hint`}>{strings.managedPathHint}</span></label>}
        <label className={styles.field}><span>{strings.action}</span><select value={this.state.action} onChange={event => this.setState({ action: event.target.value as ProposedAction })} disabled={this.state.busy}><option value="retire">{strings.retire}</option><option value="move">{strings.move}</option><option value="rename">{strings.rename}</option><option value="replace">{strings.replace}</option></select></label>
        {this.state.action !== 'retire' && <label className={styles.field}><span>{strings.replacementUrl}</span><input value={this.state.replacementUrl} onChange={event => this.setState({ replacementUrl: event.target.value })} disabled={this.state.busy} aria-describedby={`${this.ids}-replacement-hint`} /><span className={styles.hint} id={`${this.ids}-replacement-hint`}>{strings.replacementHint}</span>{this.renderInputValidation(this.state.replacementUrl)}</label>}
      </div>
      <div className={styles.toolbar}><button type="button" onClick={this.scan} disabled={this.state.busy}>{strings.scan}</button><button type="button" onClick={this.cancel} disabled={!this.state.busy}>{strings.cancel}</button><button type="button" onClick={this.clear} disabled={this.state.busy && !result}>{strings.clear}</button><button type="button" onClick={this.download} disabled={!result || this.state.busy}>{strings.export}</button></div>
      <div className={styles.status} role="status" aria-live="polite">{this.state.status}</div>
      {this.state.error && <p className={styles.error} role="alert">{this.state.error}</p>}
      {(this.state.adapterWarnings.length > 0 || result?.warnings.length) ? <div aria-label={strings.warnings}><h3>{strings.warnings}</h3>{this.state.adapterWarnings.concat(result?.warnings || []).map((warning, index) => <p className={styles.warning} key={`${warning}-${index}`}>{warning}</p>)}</div> : null}
      {result && <div aria-labelledby={`${this.ids}-results-title`}>
        <h3 id={`${this.ids}-results-title`}>{strings.results}</h3>
        <p>{replace(strings.engine, result.engine, result.source, result.durationMs.toFixed(1), result.targetUrl)}</p>
        <dl className={styles.summary}><div><dt>{strings.pages}</dt><dd>{result.summary.pagesScanned}</dd></div><div><dt>{strings.direct}</dt><dd>{result.summary.direct}</dd></div><div><dt>{strings.indirect}</dt><dd>{result.summary.indirect}</dd></div><div><dt>{strings.cycles}</dt><dd>{result.summary.cycles}</dd></div><div><dt>{strings.missing}</dt><dd>{result.summary.missing}</dd></div><div><dt>{strings.external}</dt><dd>{result.summary.external}</dd></div></dl>
        <p className={styles.privacy}>{strings.exportPrivacy}</p>
        {result.impacts.length ? <div className={styles.tableWrap}><table className={styles.table}><caption>{strings.reviewCaption}</caption><thead><tr><th scope="col">{strings.page}</th><th scope="col">{strings.relationship}</th><th scope="col">{strings.distance}</th><th scope="col">{strings.context}</th><th scope="col">{strings.rowWarnings}</th></tr></thead><tbody>{result.impacts.map(item => <tr key={item.url}><td><a href={item.url}>{item.title}</a><br /><code>{item.url}</code></td><td>{item.relation}{item.cycle ? ` · ${strings.cycle}` : ''}</td><td>{item.distance}</td><td>{item.context}</td><td>{item.warnings.length ? item.warnings.join(' ') : strings.none}</td></tr>)}</tbody></table></div> : <p>{strings.noImpact}</p>}
      </div>}
    </section>;
  }
}
