import * as duckdb from '@duckdb/duckdb-wasm';
import duckdbWorkerAsset from '@duckdb/duckdb-wasm/dist/duckdb-browser-mvp.worker.js';
import duckdbWasmAsset from '@duckdb/duckdb-wasm/dist/duckdb-mvp.wasm';
import { shapeDuckdbRows } from '../../../core/analytics';
import { AGGREGATION_SQL, AnalyticsRow, fixtureRows } from '../../../core/fixture';

type Request = { id: number; method: 'load' | 'run' | 'clear' };
type Response = { id: number; ok: boolean; result?: unknown; error?: string };
let rows: AnalyticsRow[] | undefined;
let db: duckdb.AsyncDuckDB | undefined;
let connection: duckdb.AsyncDuckDBConnection | undefined;

async function ensureDuckDb(): Promise<duckdb.AsyncDuckDBConnection> {
  if (connection) return connection;
  const worker = new Worker(duckdbWorkerAsset);
  db = new duckdb.AsyncDuckDB(new duckdb.ConsoleLogger(), worker);
  await db.instantiate(duckdbWasmAsset);
  connection = await db.connect();
  return connection;
}

async function handle(request: Request): Promise<unknown> {
  if (request.method === 'load') { rows = Array.from(fixtureRows()); return { rowCount: rows.length, status: 'fixture-loaded' }; }
  if (request.method === 'clear') { rows = undefined; if (connection) { await connection.close(); connection = undefined; } if (db) { await db.terminate(); db = undefined; } return { status: 'cleared' }; }
  if (!rows) throw new Error('Load the fixture before running DuckDB.');
  const currentRows = rows;
  const startedAt = performance.now();
  const conn = await ensureDuckDb();
  await db?.registerFileText('fixture.json', JSON.stringify(currentRows));
  await conn.query('CREATE OR REPLACE TABLE fixture AS SELECT * FROM read_json_auto(\'fixture.json\')');
  const result = await conn.query(AGGREGATION_SQL);
  const groups = shapeDuckdbRows(result.toArray() as Array<Record<string, unknown>>);
  return { engine: 'duckdb', durationMs: performance.now() - startedAt, inputRows: currentRows.length, groups, query: AGGREGATION_SQL, status: 'ok' };
}

const scope = self as unknown as { onmessage: (event: MessageEvent<Request>) => void; postMessage: (response: Response) => void };
scope.onmessage = event => { handle(event.data).then(result => scope.postMessage({ id: event.data.id, ok: true, result })).catch(error => scope.postMessage({ id: event.data.id, ok: false, error: error instanceof Error ? error.message : String(error) })); };
