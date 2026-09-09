# SPFx WASM samples

This is an example-first repository of practical, runnable SharePoint Framework samples. Each sample is kept self-contained so its browser behavior, measurements, deployment boundary, and tests are easy to inspect.

## Samples

- [`samples/wasm-image-upload/`](samples/wasm-image-upload/) — select multiple local images, optimize them in a dedicated Web Worker, inspect measured byte and duration changes, and explicitly upload the optimized files to the current SharePoint site.

The first sample is a complete generated SPFx project at `samples/wasm-image-upload/`. Root commands delegate to that workspace and the root lockfile keeps installation reproducible.

## Why test WASM against browser-native processing?

WASM is an implementation option, not a performance guarantee. Browser-native `createImageBitmap`, `OffscreenCanvas`, and `convertToBlob` already provide a local resize and encode pipeline, while a WASM codec adds binary assets, loading, CSP, and worker packaging concerns. The sample therefore measures the native worker baseline first and identifies the actual engine used. A future self-contained WASM path must use the same fixtures and runtime measurements before any performance conclusion is made.

No performance numbers are claimed in this repository. Values shown by the web part come from the files and browser run in front of the user.

## Current boundary

Milestone 1 includes local native processing and an explicit SharePoint REST upload to the current site’s Site Assets library. It does not include a WASM codec because a self-contained, verified `@jsquash/jpeg` integration for SPFx 1.23.2 Heft workers is not established. Tenant validation remains pending.
