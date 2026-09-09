# SPFx WASM samples

This is an example-first repository of practical, runnable SharePoint Framework samples. Each sample is kept self-contained so its browser behavior, measurements, deployment boundary, and tests are easy to inspect.

## Samples

- [`samples/wasm-image-upload/`](samples/wasm-image-upload/) — select multiple local images, optimize them in a dedicated Web Worker, inspect measured byte and duration changes, and explicitly upload the optimized files to the current SharePoint site.
- [`samples/wasm-local-data-plane/`](samples/wasm-local-data-plane/) — Milestone 1 local SQLite-WASM data-plane experiment with worker-owned OPFS/in-memory storage, deterministic Graph/SharePoint mocks, sync contracts, and measured local queries.

The first sample is a complete generated SPFx project at `samples/wasm-image-upload/`. Root commands delegate to that workspace and the root lockfile keeps installation reproducible.

## Why test WASM against browser-native processing?

WASM is an implementation option, not a performance guarantee. Browser-native `createImageBitmap`, `OffscreenCanvas`, and `convertToBlob` already provide a local resize and encode pipeline, while a WASM codec adds binary assets, loading, CSP, and worker packaging concerns. The sample lazily attempts `@jsquash/jpeg` 1.6.0 in a separate worker, falls back to the native worker when needed, and reports the actual engine, measured duration, bytes, and warnings. It never claims WASM is faster.

No performance numbers are claimed in this repository. Values shown by the web part come from the files and browser run in front of the user.

## Current boundary

The sample includes local worker processing, an optional lazy WASM JPEG path, and an explicit SharePoint REST upload to the current site’s Site Assets library. The Heft customization emits `.wasm` as a same-origin client-side asset and leaves `asyncWebAssembly` disabled. Tenant CSP, worker loading, and upload validation remain pending.
