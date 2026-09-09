# Implementation Log

## 2026-09-09 — Milestone 1

- Used the official `@microsoft/generator-sharepoint@1.23.2` with the React web-part template and the generated Heft toolchain.
- Pinned the generated SPFx packages and build rig to 1.23.2; added the official `@microsoft/sp-http` client for the upload path.
- Replaced the generated hello-world UI with a multiple-file image selector, measured result summary, live status, accessible errors, and explicit upload action.
- Kept image decode, resize, and JPEG encoding in a dedicated worker using `createImageBitmap` with `imageOrientation: "from-image"` when accepted, `OffscreenCanvas`, and `convertToBlob`.
- Unsupported worker/image capabilities return an error to the UI; the sample does not move expensive processing onto the main thread.
- Upload uses `context.pageContext.web.absoluteUrl`, `serverRelativeUrl`, and `context.spHttpClient` to add optimized JPEGs to the current site’s Site Assets library. No custom API permission request is included.
- Did not include `@jsquash/jpeg`: a self-contained SPFx 1.23.2 Heft worker/WASM asset-loading path was not verified, so the sample retains a clean native baseline and makes no WASM performance claim.
- Added deterministic helper tests and generated SVG fixture instructions. No benchmark results, large binaries, or tenant screenshots are included.

## Evidence boundary

- `npm ci`, tests, build, and solution packaging are repository checks only; they do not validate an authorized SharePoint tenant.
- Tenant CSP, worker asset loading, Site Assets availability, permissions, and upload behavior require validation in an authorized tenant.

## 2026-09-09 — Lazy WASM worker slice

- Added `@jsquash/jpeg` 1.6.0 as a lazy codec dependency. The initial web-part path does not import the codec.
- Added the SPFx Heft customization that emits `.wasm` with `asset/resource`, uses a same-origin client-side asset URL, and explicitly leaves `asyncWebAssembly` disabled.
- Kept the existing Blob worker as the native path. Because package imports cannot resolve inside that Blob, the WASM path is a separate lazy Webpack worker asset; image decode, resize, and both encoders remain in workers.
- Added native fallback warnings for lazy-worker startup, WebAssembly, WASM fetch/compile/CSP, codec, and encode failures. Results report the measured engine, duration, original bytes, optimized bytes, and warnings.
- Added deterministic tests for engine selection, mixed-engine selection, fallback warnings, and measured result shaping. No benchmark values were added.
- Repository verification passed: `npm ci`, `npm test`, `npm run build`, and `npm run package-solution`. Tenant validation remains pending.
