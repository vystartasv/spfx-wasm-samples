import * as React from 'react';
import { DataPlaneClient } from '../client';
import type { Namespace, ShowcaseRow, Status } from '../../../core/types';
import styles from './LocalDataPlane.module.scss';
import * as strings from 'WasmLocalDataPlaneWebPartStrings';

export interface LocalDataPlaneProps { namespace: Namespace; }
interface State { status?: Status; rows: ShowcaseRow[]; message: string; error?: string; busy: boolean; offline: boolean; benchmark: Array<{ name: string; ms: number; rows: number }>; }
let nextInstanceId = 0;

export default class LocalDataPlane extends React.Component<LocalDataPlaneProps, State> {
  private readonly ids = `local-data-plane-${++nextInstanceId}`;
  private readonly client = new DataPlaneClient();
  public state: State = { rows: [], message: strings.initial, busy: true, offline: typeof navigator !== 'undefined' && !navigator.onLine, benchmark: [] };
  public async componentDidMount(): Promise<void> { window.addEventListener('online', this.online); window.addEventListener('offline', this.offline); try { await this.client.init(this.props.namespace); await this.refresh(strings.ready); } catch (error) { this.fail(error); } }
  public componentWillUnmount(): void { window.removeEventListener('online', this.online); window.removeEventListener('offline', this.offline); this.client.terminate(); }
  private readonly online = (): void => this.setState({ offline: false });
  private readonly offline = (): void => this.setState({ offline: true, message: strings.offline });
  private fail(error: unknown): void { this.setState({ busy: false, error: error instanceof Error ? error.message : String(error), message: strings.failed }); }
  private async refresh(message: string): Promise<void> { const status = await this.client.status() as Status; this.setState({ status, busy: false, message }); }
  private async run(message: string, action: () => Promise<unknown>): Promise<void> { this.setState({ busy: true, error: undefined, message }); try { await action(); await this.refresh(message); } catch (error) { this.fail(error); } }
  private async query(name = strings.warmQuery): Promise<void> { const start = performance.now(); try { const rows = await this.client.query({ limit: 50 }) as ShowcaseRow[]; const message = strings.queryComplete.replace('{0}', name); this.setState(state => ({ rows, benchmark: [...state.benchmark, { name, ms: performance.now() - start, rows: rows.length }], busy: false, message })); await this.refresh(message); } catch (error) { this.fail(error); } }
  private async hydrate(): Promise<void> { await this.run(strings.coldRunning, async () => { await this.client.clear(); await this.client.hydrate(); await this.query(strings.coldQuery); }); }
  private async optimisticWrite(): Promise<void> { await this.run(strings.optimisticRunning, async () => { await this.client.mutate('project-00001', { name: strings.demoEdit }); await this.client.flush(); }); }
  public render(): React.ReactElement {
    const status = this.state.status;
    return <section className={styles.root} aria-labelledby={`${this.ids}-title`}>
      <h2 id={`${this.ids}-title`}>{strings.title}</h2>
      <p>{strings.description}</p>
      <div className={styles.status} role="status" aria-live="polite">{this.state.message} {this.state.offline ? strings.offlineLabel : strings.onlineLabel} {status ? strings.storageStatus.replace('{0}', status.storage).replace('{1}', String(status.pendingWrites)).replace('{2}', String(status.conflicts)).replace('{3}', status.dbBytes === null ? strings.unavailable : String(status.dbBytes)) : ''}</div>
      {this.state.error && <p className={styles.error} role="alert">{this.state.error}</p>}
      <div className={styles.toolbar} aria-label={strings.controls}>
        <button type="button" onClick={() => this.hydrate()} disabled={this.state.busy}>{strings.cold}</button>
        <button type="button" onClick={() => this.query()} disabled={this.state.busy}>{strings.warm}</button>
        <button type="button" onClick={() => this.run(strings.zeroRunning, () => this.client.sync())} disabled={this.state.busy || this.state.offline}>{strings.zero}</button>
        <button type="button" onClick={() => this.optimisticWrite()} disabled={this.state.busy}>{strings.optimistic}</button>
        <button type="button" onClick={() => this.run(strings.conflictRunning, () => this.client.simulateConflict())} disabled={this.state.busy}>{strings.conflict}</button>
        <button type="button" onClick={() => this.run(strings.expiredRunning, () => this.client.sync('graph-users', 'expired-cursor'))} disabled={this.state.busy}>{strings.expired}</button>
        <button type="button" onClick={() => this.run(strings.clearRunning, () => this.client.clear())} disabled={this.state.busy}>{strings.clear}</button>
      </div>
      <div className={styles.panel}><h3>{strings.showcase}</h3><p>{this.state.rows.length ? strings.measuredRows.replace('{0}', String(this.state.rows.length)) : strings.hydrateFirst}</p><table className={styles.table}><caption className="ms-hidden">{strings.showcaseCaption}</caption><thead><tr><th scope="col">{strings.project}</th><th scope="col">{strings.status}</th><th scope="col">{strings.owner}</th><th scope="col">{strings.contact}</th></tr></thead><tbody>{this.state.rows.map(row => <tr key={row.projectId}><td>{row.projectName}</td><td>{row.projectStatus}</td><td>{row.ownerName} ({row.ownerMail})</td><td>{row.contactName || strings.none}{row.contactAccount ? ` (${row.contactAccount})` : ''}</td></tr>)}</tbody></table></div>
      <div className={styles.panel}><h3>{strings.syncStatus}</h3><p>{strings.sqliteStatus.replace('{0}', status?.sqliteVersion || strings.notInitialized).replace('{1}', status?.freshness.map(source => strings.sourceFreshness.replace('{0}', source.source).replace('{1}', source.lastSyncedAt ? new Date(source.lastSyncedAt).toISOString() : strings.pending)).join(' · ') || strings.noCursors)}</p><p>{strings.opaque}</p></div>
      <div className={styles.panel}><h3>{strings.benchmark}</h3><p>{strings.browserValues}</p><ul>{this.state.benchmark.map((item, index) => <li key={`${item.name}-${index}`}>{strings.rows.replace('{0}', item.name).replace('{1}', item.ms.toFixed(2)).replace('{2}', String(item.rows))}</li>)}</ul></div>
    </section>;
  }
}
