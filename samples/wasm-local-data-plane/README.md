# WASM local data plane — Milestone 1

This is a runnable SPFx experiment for a local data plane: the primary operational database is SQLite-WASM, one dedicated Web Worker owns SQLite, all SQL, transactions, and sync cursor commits, and OPFS is preferred when available. The UI is deliberately explicit that local cache data is not a security boundary and that the model is local ACID plus eventual remote sync—not distributed ACID and not a threshold-bypass mechanism.

Milestone 1 uses deterministic mock SharePoint, Graph users, CRM, and enterprise adapters. Their contracts preserve room for real Graph/SharePoint implementations; no tenant compatibility or performance claim is made until a tenant run is recorded.

## Run and verify

From `/Users/vilius/spfx-wasm-samples`:

```sh
npm ci
npm run test:local-data-plane
npm run build:local-data-plane
npm run package:local-data-plane
```

The root equivalents also run the existing image sample:

```sh
npm test
npm run build
npm run package-solution
```

Start the sample workbench with `npm --workspace samples/wasm-local-data-plane run start`, then open `https://localhost:4321/temp/workbench.html` and add **Local data plane**. Use **Cold hydrate** before local queries. Every displayed timing, row count, status, and failure is returned by that browser run; there are no seeded benchmark values.

## Fixture and test boundary

Adapters generate records page-by-page inside the worker: 10,000 users, 10,000 projects, 5,000 CRM contacts, and 20,000 deterministic relationships. The generator is lazy so importing the bundle does not allocate the fixture. Tests use small fixtures or an in-memory adapter for fast contract checks. `sqlite-store.test.ts` separately initializes the official SQLite-WASM package and exercises the same schema/store methods; it does not prove OPFS or a SharePoint tenant.

Graph JSON batch policy is capped at 20 requests. A throttled subrequest is individually retryable; this milestone's mocks expose the classification and the worker reports it, while a real batch transport is future work.

## Decision gate

Copy this template into the milestone evidence record after a controlled run:

```text
Decision: GO | MODIFY | STOP
Environment: browser/version, SPFx version, tenant/site or mock
Evidence: commands, test/build/package results, run IDs, raw measurements
GO if: correctness tests pass; tenant policy/CSP/OPFS behavior is understood; measured workload meets the agreed target
MODIFY if: correctness is sound but packaging, cursor recovery, identity quality, or measured cost needs change
STOP if: data isolation, loss/replay safety, security boundary, or worker/SQLite packaging cannot be demonstrated
Open risks: ...
```

See [`ARCHITECTURE.md`](ARCHITECTURE.md), [`BENCHMARKS.md`](BENCHMARKS.md), and [`docs/limitations.md`](docs/limitations.md) for the evidence boundary.
