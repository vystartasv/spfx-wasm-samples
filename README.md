# SPFx WASM samples

This is an example-first repository of practical, runnable SharePoint Framework samples. Each sample is kept self-contained so its browser behavior, measurements, deployment boundary, and tests are easy to inspect.

## Samples

- [`samples/wasm-image-upload/`](samples/wasm-image-upload/) — select multiple local images, optimize them in a dedicated Web Worker, inspect measured byte and duration changes, and explicitly upload the optimized files to the current SharePoint site.
- [`samples/wasm-smart-upload/`](samples/wasm-smart-upload/) — prepare one file locally with worker-based SHA-256 hashing and deterministic chunking before an explicit upload.
- [`samples/wasm-local-data-plane/`](samples/wasm-local-data-plane/) — Milestone 1 local SQLite-WASM data-plane experiment with worker-owned OPFS/in-memory storage, deterministic Graph/SharePoint mocks, sync contracts, and measured local queries.
- [`samples/wasm-sqlite-cache/`](samples/wasm-sqlite-cache/) — focused worker-owned SQLite-WASM cache for one list-style dataset with local CRUD, query, outbox, and simulated sync states.
- [`samples/wasm-duckdb-analytics/`](samples/wasm-duckdb-analytics/) — measured DuckDB-WASM worker aggregation against a native TypeScript baseline.
- [`samples/wasm-duplicate-detector/`](samples/wasm-duplicate-detector/) — local SHA-256 duplicate-file detector with deterministic fixture mode.
- [`samples/wasm-local-ocr/`](samples/wasm-local-ocr/) — local browser OCR in a dedicated worker.

Validation status: repository tests, production builds, and solution packaging are run from the root; tenant permissions, CSP, OPFS browser behavior, and SharePoint upload behavior remain deployment checks. Image-upload and smart-upload upload adapters support SharePoint web-part/full-page hosts only.

The first sample is a complete generated SPFx project at `samples/wasm-image-upload/`. Root commands delegate to that workspace and the root lockfile keeps installation reproducible.

## Contributing and project policies

See [AGENTS.md](AGENTS.md), [CONTRIBUTING.md](CONTRIBUTING.md), [SECURITY.md](SECURITY.md), [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md), and [LICENSE](LICENSE). Repository invariants include validating worker RPC envelopes before dispatch, validating sync records before applying a page or advancing its cursor, using collision-resistant namespace filenames, suppressing cancelled preparation results, and awaiting cache storage initialization before status reads.

## Why test WASM against browser-native processing?

WASM is an implementation option, not a performance guarantee. Browser-native `createImageBitmap`, `OffscreenCanvas`, and `convertToBlob` already provide a local resize and encode pipeline, while a WASM codec adds binary assets, loading, CSP, and worker packaging concerns. The sample lazily attempts `@jsquash/jpeg` 1.6.0 in a separate worker, falls back to the native worker when needed, and reports the actual engine, measured duration, bytes, and warnings. It never claims WASM is faster.

No performance numbers are claimed in this repository. Values shown by the web part come from the files and browser run in front of the user.

## Current boundary

The sample includes local worker processing, an optional lazy WASM JPEG path, and an explicit SharePoint REST upload to the current site’s Site Assets library. The Heft customization emits `.wasm` as a same-origin client-side asset and leaves `asyncWebAssembly` disabled. Tenant CSP, worker loading, and upload validation remain pending.
