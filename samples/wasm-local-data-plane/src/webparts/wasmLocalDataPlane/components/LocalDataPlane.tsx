import * as React from 'react';
import { DataPlaneClient } from '../client';
import type { Namespace, ShowcaseRow, Status } from '../../../core/types';
import styles from './LocalDataPlane.module.scss';

export interface LocalDataPlaneProps { namespace: Namespace; }
interface State { status?: Status; rows: ShowcaseRow[]; message: string; error?: string; busy: boolean; offline: boolean; benchmark: Array<{ name: string; ms: number; rows: number }>; }

export default class LocalDataPlane extends React.Component<LocalDataPlaneProps, State> {
  private readonly client = new DataPlaneClient();
  public state: State = { rows: [], message: 'Starting the dedicated worker…', busy: true, offline: typeof navigator !== 'undefined' && !navigator.onLine, benchmark: [] };
  public async componentDidMount(): Promise<void> { window.addEventListener('online', this.online); window.addEventListener('offline', this.offline); try { await this.client.init(this.props.namespace); await this.refresh('SQLite worker ready.'); } catch (error) { this.fail(error); } }
  public componentWillUnmount(): void { window.removeEventListener('online', this.online); window.removeEventListener('offline', this.offline); this.client.terminate(); }
  private readonly online = (): void => this.setState({ offline: false });
  private readonly offline = (): void => this.setState({ offline: true, message: 'Offline: local reads remain available; remote writes wait.' });
  private fail(error: unknown): void { this.setState({ busy: false, error: error instanceof Error ? error.message : String(error), message: 'The worker reported a failure.' }); }
  private async refresh(message: string): Promise<void> { const status = await this.client.status() as Status; this.setState({ status, busy: false, message }); }
  private async run(message: string, action: () => Promise<unknown>): Promise<void> { this.setState({ busy: true, error: undefined, message }); try { await action(); await this.refresh(message); } catch (error) { this.fail(error); } }
  private async query(name = 'warm local query'): Promise<void> { const start = performance.now(); try { const rows = await this.client.query({ limit: 50 }) as ShowcaseRow[]; this.setState(state => ({ rows, benchmark: [...state.benchmark, { name, ms: performance.now() - start, rows: rows.length }], busy: false, message: `${name} completed with measured values.` })); await this.refresh(`${name} completed with measured values.`); } catch (error) { this.fail(error); } }
  private async hydrate(): Promise<void> { await this.run('Cold hydration is running in the worker…', async () => { await this.client.clear(); await this.client.hydrate(); await this.query('cold hydration + query'); }); }
  private async optimisticWrite(): Promise<void> { await this.run('Applying an optimistic local write…', async () => { await this.client.mutate('project-00001', { name: 'Local demo edit' }); await this.client.flush(); }); }
  public render(): React.ReactElement {
    const status = this.state.status;
    return <section className={styles.root} aria-labelledby="local-data-plane-title">
      <h2 id="local-data-plane-title">Local data plane experiment</h2>
      <p>SQLite-WASM is the operational local database. One dedicated worker owns SQL, transactions, and OPFS when this browser context permits it. This measures an experiment; it is not a security boundary or distributed ACID system.</p>
      <div className={styles.status} role="status" aria-live="polite">{this.state.message} {this.state.offline ? 'Browser offline.' : 'Browser online.'} {status ? `Storage: ${status.storage}; pending writes: ${status.pendingWrites}; conflicts: ${status.conflicts}; DB bytes: ${status.dbBytes === null ? 'unavailable' : status.dbBytes}.` : ''}</div>
      {this.state.error && <p className={styles.error} role="alert">{this.state.error}</p>}
      <div className={styles.toolbar} aria-label="Data plane controls">
        <button type="button" onClick={() => this.hydrate()} disabled={this.state.busy}>Cold hydrate</button>
        <button type="button" onClick={() => this.query()} disabled={this.state.busy}>Warm local query</button>
        <button type="button" onClick={() => this.run('Zero-change sync is running…', () => this.client.sync())} disabled={this.state.busy || this.state.offline}>Zero-change sync</button>
        <button type="button" onClick={() => this.optimisticWrite()} disabled={this.state.busy}>Optimistic write + flush</button>
        <button type="button" onClick={() => this.run('Conflict simulation is running…', () => this.client.simulateConflict())} disabled={this.state.busy}>Simulate conflict</button>
        <button type="button" onClick={() => this.run('Expired-cursor failure is being simulated…', () => this.client.sync('graph-users', 'expired-cursor'))} disabled={this.state.busy}>Simulate expired cursor</button>
        <button type="button" onClick={() => this.run('Clearing this namespace…', () => this.client.clear())} disabled={this.state.busy}>Clear data</button>
      </div>
      <div className={styles.panel}><h3>Showcase: project → person 360</h3><p>{this.state.rows.length ? `${this.state.rows.length} measured local rows.` : 'Hydrate data, then run a warm local query.'}</p><table className={styles.table}><caption className="ms-hidden">Project showcase results</caption><thead><tr><th>Project</th><th>Status</th><th>Owner</th><th>CRM contact</th></tr></thead><tbody>{this.state.rows.map(row => <tr key={row.projectId}><td>{row.projectName}</td><td>{row.projectStatus}</td><td>{row.ownerName} ({row.ownerMail})</td><td>{row.contactName || '—'}{row.contactAccount ? ` (${row.contactAccount})` : ''}</td></tr>)}</tbody></table></div>
      <div className={styles.panel}><h3>Sync status and freshness</h3><p>SQLite {status?.sqliteVersion || 'not initialized'}; {status?.freshness.map(source => `${source.source}: ${source.lastSyncedAt ? new Date(source.lastSyncedAt).toISOString() : 'pending'}`).join(' · ') || 'no source cursors yet'}.</p><p>Opaque nextLink/deltaLink values are retained unchanged by the worker. Mock adapters are deterministic; real Graph/SharePoint adapters remain a future contract implementation.</p></div>
      <div className={styles.panel}><h3>Measured benchmark panel</h3><p>Values below are from this browser session; no numbers are prefilled.</p><ul>{this.state.benchmark.map((item, index) => <li key={`${item.name}-${index}`}>{item.name}: {item.ms.toFixed(2)} ms, {item.rows} rows</li>)}</ul></div>
    </section>;
  }
}
