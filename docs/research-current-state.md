# SPFx WASM Samples — Current State Research

**Research date:** 2026-09-09
**Target:** SharePoint Online, SPFx 1.23.2, evergreen browsers

## Verified baseline

- **SPFx:** Microsoft’s compatibility table lists SPFx 1.23.2 as the latest listed version. SPFx 1.22+ uses the Heft-based toolchain; Webpack remains part of the build pipeline.
  - https://learn.microsoft.com/en-us/sharepoint/dev/spfx/compatibility
  - https://learn.microsoft.com/en-us/sharepoint/dev/spfx/toolchain/sharepoint-framework-toolchain-rushstack-heft
  - https://learn.microsoft.com/en-us/sharepoint/dev/spfx/release-1.23
- **Toolchain:** SPFx 1.23.x is documented with Node.js 22, React 17.0.1, and TypeScript versions in Microsoft’s compatibility range. Dependencies must be pinned and verified against the generated project.
- **Static assets:** `includeClientSideAssets: true` packages client-side assets in the `.sppkg`; otherwise assets may be served from the Microsoft 365 CDN or app-catalog site collection depending on deployment configuration.
  - https://learn.microsoft.com/en-us/sharepoint/dev/spfx/web-parts/get-started/hosting-webpart-from-office-365-cdn
  - https://learn.microsoft.com/en-us/sharepoint/dev/spfx/web-parts/get-started/deploy-web-part-to-cdn

## Browser/runtime constraints

- Web Workers run expensive processing outside the UI thread.
  - https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API
- `createImageBitmap()` accepts `File`/`Blob` input, can resize during decode, and supports EXIF-aware orientation with `imageOrientation: "from-image"`.
  - https://developer.mozilla.org/en-US/docs/Web/API/WorkerGlobalScope/createImageBitmap
- `OffscreenCanvas` and `convertToBlob()` support worker-side rendering and asynchronous image encoding in current evergreen browsers.
  - https://developer.mozilla.org/en-US/docs/Web/API/OffscreenCanvas
  - https://developer.mozilla.org/en-US/docs/Web/API/OffscreenCanvas/convertToBlob
- IndexedDB is the broad persistence option for structured data and Blobs; OPFS is an optional optimization for secure-context file work and is available in workers.
  - https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API
  - https://developer.mozilla.org/en-US/docs/Web/API/File_System_API/Origin_private_file_system
- WebGPU is limited-availability and not a Milestone 1 dependency.
  - https://developer.mozilla.org/en-US/docs/Web/API/WebGPU_API
- WASM SIMD and optional modules require runtime feature detection; do not assume support.
  - https://webassembly.org/roadmap/
  - https://developer.mozilla.org/en-US/docs/WebAssembly/JavaScript_interface/validate_static
- A CSP can block WASM compilation unless `script-src` allows `wasm-unsafe-eval` or `unsafe-eval`; worker creation is also governed by `worker-src` and related fallback rules.
  - https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/script-src
  - https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/worker-src
- Cross-origin isolation depends on HTTP response headers such as COOP/COEP. An SPFx web part cannot set the top-level SharePoint response headers, so SharedArrayBuffer, WASM threads, and libraries requiring cross-origin isolation are unsupported as a baseline.
  - https://developer.mozilla.org/en-US/docs/Web/API/Window/crossOriginIsolated
  - https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Cross-Origin-Opener-Policy

## Implemented technology decision

### Native fallback: browser-native worker pipeline

Use `createImageBitmap` → `OffscreenCanvas` → `convertToBlob` in a dedicated worker. This handles local decode, orientation-aware resizing, re-encoding, byte measurement, and UI-thread avoidance without shipping a large runtime.

This remains the fallback: WASM is not automatically better when browser-native APIs already solve the workload.

### Optional engine: lazy-loaded WASM codec

Include a separately loaded WASM codec only if the implementation produces a measurable user benefit for the tested workload. Candidate: `@jsquash/jpeg` 1.6.0, Apache-2.0, from the jSquash project:

- https://github.com/jamsinclair/jSquash
- https://www.npmjs.com/package/@jsquash/jpeg

The implementation loads the WASM worker only after optimization begins. The codec is initialized from a fetched emitted `.wasm` URL, and WebAssembly absence, fetch/compile/CSP failure, codec failure, and encode failure return to browser-native encoding with visible warnings. The native worker remains available when the lazy worker module cannot start.

The current Blob worker cannot resolve package imports because its source is serialized into a Blob URL. The WASM path is consequently a separate lazy worker module. The SPFx customization keeps the worker chunk out of component-dependency audit metadata because it is a browser worker asset rather than a SharePoint component entry.

## Alternatives rejected for Milestone 1

- `browser-image-compression`: convenient MIT package, but its documented worker path defaults to an external jsDelivr URL; this is undesirable for a self-contained SPFx sample.
  - https://github.com/Donaldcwl/browser-image-compression
- `Compressor.js`: small MIT package, but its documented API is main-thread oriented.
  - https://github.com/fengyuanchen/compressorjs
- `pica`: strong resizing library with worker/WASM options, but it does not cover the full orientation/metadata/upload pipeline alone.
  - https://github.com/nodeca/pica
- `wasm-vips`: requires SharedArrayBuffer/cross-origin isolation, is large, and is described as early development.
  - https://github.com/kleisauke/wasm-vips
- `sharp`: excellent image library, but targets Node-API runtimes rather than browser SPFx execution.
  - https://github.com/lovell/sharp

## Evidence boundaries

- No tenant validation was performed during this research.
- Repository builds verify emitted worker/WASM assets and package construction; they do not verify tenant CSP or runtime worker loading.
- SharePoint page CSP and worker behavior must be checked in an authorized tenant before claiming production compatibility.
- No benchmark values are claimed here. The sample must generate measurements from actual fixture inputs and display those measurements in the UI.
