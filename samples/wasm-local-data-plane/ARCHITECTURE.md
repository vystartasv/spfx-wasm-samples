# Architecture

```text
React SPFx web part
        │ versioned RPC
one dedicated DataPlane Worker
        ├── SQLite-WASM OO1 DB
        │     ├── OPFS database when available
        │     └── explicit :memory: fallback + visible status
        ├── migrations, SQL, transactions, cursors, outbox
        └── deterministic adapters (future real Graph/SharePoint contract)
```

The worker is the sole owner of the database. The main thread never receives a database handle and never executes SQL. A page is applied in a local transaction before its nextLink is committed; if the worker is interrupted, the source retains the previous cursor and the page can be replayed idempotently. Cursors are opaque full strings and are persisted unchanged.

Schema namespaces are JSON keys containing `tenantId`, `userObjectId`, and `applicationId`; runtime metadata stores the same namespace and selected storage mode. This is application isolation, not authorization. The cache may contain sensitive data and must not be used to bypass SharePoint, Graph, enterprise, or threshold controls.

The baseline uses the same generated records and performs ordinary in-memory paging/composition. It has no artificial delay or network penalty. The local benchmark records browser timings rather than importing numbers from a paper.
