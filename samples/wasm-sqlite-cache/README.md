# WASM SQLite cache

Small focused SPFx 1.23.2 sample showing a worker-owned offline-first cache for one SharePoint-list-style dataset. It demonstrates schema migration, deterministic fixture hydration, local search/filter/sort, optimistic CRUD, outbox markers, explicit simulated sync success/failure/conflict states, namespace keying, reset, OPFS preference, and memory fallback.

## Run

From the repository root:

```sh
npm ci
npm test
npm run build:sqlite-cache
npm run package:sqlite-cache
```

To open the workbench:

```sh
npm --workspace samples/wasm-sqlite-cache run start
```

Open `https://localhost:4321/temp/workbench.html`, add **SQLite list cache**, hydrate the fixture, and exercise the controls. For deployment, upload `samples/wasm-sqlite-cache/sharepoint/solution/wasm-sqlite-cache.sppkg` to the tenant app catalog, deploy it, and add the web part to a page. Use the generated package from the same build you reviewed; do not treat this sample as a tenant compatibility certification.

See [`ARCHITECTURE.md`](ARCHITECTURE.md), [`BENCHMARKS.md`](BENCHMARKS.md), and [`docs/limitations.md`](docs/limitations.md).
