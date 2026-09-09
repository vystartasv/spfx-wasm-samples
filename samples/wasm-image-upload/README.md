# WASM image upload

This is the first runnable sample in the repository. It selects multiple local images, optimizes them in a dedicated Web Worker, reports measured before/after bytes and processing duration, and uploads the optimized JPEGs only after the user activates the upload button.

The displayed engine is `Browser-native worker`. A WASM engine is not bundled in Milestone 1: a self-contained `@jsquash/jpeg` worker/WASM asset path that builds and packages reliably with SPFx 1.23.2 Heft has not been verified. The sample never claims that WASM is faster.

## Prerequisites

- Node.js 22.14.x through 22.x, npm, and a supported evergreen browser.
- An SPFx 1.23.2 development environment.
- For upload validation, an authorized SharePoint Online site where the signed-in user can add files to Site Assets.

## Run and verify

From the repository root:

```sh
npm ci
npm test
npm run build
npm run package-solution
```

Start the local workbench with:

```sh
npm run start
```

Open `https://localhost:4321/temp/workbench.html`, add the WASM Image Upload web part, choose image files, and activate Optimize locally. The values shown are measured from that browser run. The generated solution package is `sharepoint/solution/spfx-wasm-samples.sppkg`.

## SharePoint deployment and permissions

Upload `sharepoint/solution/spfx-wasm-samples.sppkg` to the organization’s SharePoint app catalog, deploy it, and add the WASM Image Upload web part to a SharePoint page. The package requests no Microsoft Graph or custom API permission. The upload uses the SPFx page context and SharePoint REST through `SPHttpClient` to add files to the current site’s Site Assets library, so the signed-in user needs add-item permission there. Upload is never automatic.

## Browser support

The processing path requires a Web Worker, worker `createImageBitmap`, `OffscreenCanvas`, a 2D context, and `convertToBlob`. The UI reports an accessible error when a required capability is unavailable and does not run the expensive pipeline on the main thread. EXIF orientation is requested with `imageOrientation: "from-image"`; when the browser rejects that option, the result carries a visible warning.

## Privacy and limitations

Selected files are read locally and sent to the local worker. They leave the browser only after the explicit upload action. Output is JPEG, quality `0.82`, with a maximum dimension of `2048` pixels; metadata is not preserved. The default destination is the current site’s Site Assets library, which must exist and permit uploads. There is no batch retry or progress bar in this milestone.

Use [`docs/benchmark-methodology.md`](../../docs/benchmark-methodology.md) for deterministic fixture generation and comparison procedure. No benchmark values or tenant screenshots are included. Tenant validation of CSP, worker loading, browser behavior, Site Assets availability, permissions, and upload remains pending.
