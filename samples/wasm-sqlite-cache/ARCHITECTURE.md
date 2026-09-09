# SQLite cache architecture

The web part owns a small client that sends versioned RPC messages to one dedicated module Web Worker. The worker owns the store and all writes. `SqliteStore` uses official `@sqlite.org/sqlite-wasm`, applies ordered migrations, prefers `oo1.OpfsDb`, and falls back to an in-memory SQLite database when OPFS is unavailable. If the SQLite module itself cannot initialize, the worker uses the sample-local `MemoryStore` and reports a warning.

The schema is intentionally narrow: `items` is one SharePoint-list-style dataset keyed by `namespace + id`; `outbox` records optimistic create/update/delete operations; `conflicts` records simulated remote conflicts; `metadata` stores the last simulated sync time. The namespace contract is `{ tenantId, userObjectId, applicationId }`. The UI derives the first two from SPFx page context and uses a fixed sample application id.

Sync is a local simulation with explicit success, failure, and conflict branches. It makes no fabricated remote call and does not claim tenant compatibility, OPFS persistence, or offline behavior beyond the tests and the browser run in front of the user.
