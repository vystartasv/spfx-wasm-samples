# Current platform evidence

Checked 2026-09-09 against the official SQLite documentation and package metadata.

- The official package is [`@sqlite.org/sqlite-wasm`](https://www.npmjs.com/package/@sqlite.org/sqlite-wasm), pinned in this sample at `3.53.4-build1`.
- SQLite's [JavaScript API index](https://www.sqlite.org/wasm/doc/trunk/api-index.md) documents the OO1 API used here.
- SQLite's [persistence guidance](https://www.sqlite.org/wasm/doc/trunk/persistence.md) says OPFS support is a worker-side persistence path and documents the browser capability/header constraints.
- The package README documents `sqlite3.oo1.OpfsDb` when `opfs` is available and `sqlite3.oo1.DB` for the in-memory fallback. It also states that Node support is currently in-memory only.
- The Graph 20-request batching requirement is encoded as an application contract in `sync-contract.ts`; this milestone does not claim a live Graph transport or tenant verification.

## Measured vs unverified

Measured by code/tests: deterministic fixture generation, page/cursor behavior, schema/store operations, local joins, optimistic outbox transitions, and error classification. Unverified: OPFS in every target browser, SPFx Heft package behavior in a tenant, real service cursors/throttling, permissions, and all benchmark values.
