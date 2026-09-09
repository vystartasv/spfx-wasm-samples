import * as React from 'react';
import { DuplicateDetectorClient } from '../client';
import { DetectorResult, MAX_FILES, MAX_FILE_BYTES, MAX_TOTAL_BYTES, validateInputs } from '../../../core/duplicateDetector';
import styles from './WasmDuplicateDetector.module.scss';
import type { IWasmDuplicateDetectorProps } from './IWasmDuplicateDetectorProps';
import * as strings from 'WasmDuplicateDetectorWebPartStrings';
interface State { result?: DetectorResult; message: string; error?: string; busy: boolean; }
export default class WasmDuplicateDetector extends React.Component<IWasmDuplicateDetectorProps, State> {
  private readonly client = new DuplicateDetectorClient();
  public state: State = { message: strings.initial, busy: false };
  public componentWillUnmount(): void { this.client.terminate(); }
  private scan = async (event: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const files = Array.from(event.target.files || []); const errors = validateInputs(files);
    if (errors.length) { this.setState({ error: errors.join(' '), message: strings.validation, busy: false }); return; }
    this.setState({ busy: true, error: undefined, result: undefined, message: strings.hashing });
    try { const inputs = await Promise.all(files.map(async file => ({ name: file.name, size: file.size, type: file.type, data: await file.arrayBuffer() }))); const result = await this.client.hash(inputs); this.setState({ result, busy: false, message: strings.complete.replace('{0}', String(result.groups.length)) }); }
    catch (error) { this.setState({ busy: false, error: error instanceof Error ? error.message : String(error), message: strings.failed }); }
    event.target.value = '';
  };
  private fixture = async (): Promise<void> => { this.setState({ busy: true, error: undefined, result: undefined, message: strings.hashing }); try { const result = await this.client.hash([], 10000); this.setState({ result, busy: false, message: strings.fixtureComplete.replace('{0}', String(result.groups.length)) }); } catch (error) { this.setState({ busy: false, error: error instanceof Error ? error.message : String(error), message: strings.fixtureFailed }); } };
  private cancel = (): void => { this.client.cancel(); this.setState({ busy: false, error: undefined, message: strings.cancelled }); };
  private clear = (): void => this.setState({ result: undefined, error: undefined, busy: false, message: strings.initial });
  public render(): React.ReactElement { const { result } = this.state; return <section className={styles.root} aria-labelledby="duplicate-detector-title"><h2 id="duplicate-detector-title">{strings.title}</h2><p>{strings.description}</p><p>{strings.limits.replace('{0}', String(MAX_FILES)).replace('{1}', String(MAX_FILE_BYTES / 1024 / 1024)).replace('{2}', String(MAX_TOTAL_BYTES / 1024 / 1024))}</p><div className={styles.status} role="status" aria-live="polite">{this.state.message}</div>{this.state.error && <p className={styles.error} role="alert">{this.state.error}</p>}<div className={styles.toolbar} aria-label={strings.controls}><label><span>{strings.select}</span><input type="file" multiple onChange={this.scan} disabled={this.state.busy} /></label><button type="button" onClick={this.fixture} disabled={this.state.busy}>{strings.fixture}</button><button type="button" onClick={this.cancel} disabled={!this.state.busy}>{strings.cancel}</button><button type="button" onClick={this.clear} disabled={this.state.busy && !result}>{strings.clear}</button></div>{result && <div aria-labelledby="results-title"><h3 id="results-title">{strings.measured}</h3><p>{strings.scanned.replace('{0}', result.bytesScanned.toLocaleString()).replace('{1}', result.durationMs.toFixed(2)).replace('{2}', result.engine).replace('{3}', result.duplicateBytes.toLocaleString())}</p>{result.warnings.map(warning => <p className={styles.warning} key={warning}>{strings.warning.replace('{0}', warning)}</p>)}<ul aria-label={strings.groups}>{result.groups.map(group => <li className={styles.group} key={group.hash}><strong>{strings.groupSummary.replace('{0}', String(group.files.length)).replace('{1}', group.size.toLocaleString())}</strong><code> {group.hash}</code><table className={styles.table}><caption>{strings.caption.replace('{0}', group.hash)}</caption><thead><tr><th scope="col">{strings.name}</th><th scope="col">{strings.bytes}</th><th scope="col">{strings.type}</th></tr></thead><tbody>{group.files.map(file => <tr key={file.name}><td>{file.name}</td><td>{file.size}</td><td>{file.type || strings.unknown}</td></tr>)}</tbody></table></li>)}</ul>{!result.groups.length && <p>{strings.none}</p>}</div>}</section>; }
}
