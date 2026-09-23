# Local OCR SPFx sample

Targets SPFx 1.24.0. npm's latest stable package is currently 1.23.2, so this sample remains pinned to 1.23.2 until 1.24.0 is published. It recognizes one selected local image in a dedicated browser worker. The file is read with `File.arrayBuffer()` and transferred to the worker; there is no SharePoint, telemetry, or upload call.

## Run

From the workspace root:

```bash
npm ci
npm --workspace samples/wasm-local-ocr run start
```

Use the local workbench, select an image, choose the (packaged) `eng` model, and run OCR. `assets/ocr-fixture.svg` is a deterministic fixture; it contains real rendered text, not a hard-coded OCR result.

The pinned engine is `tesseract.js@7.0.0`; the LSTM core and English trained data are emitted as same-origin assets. The model is lazy: it is fetched by the OCR worker only on the first run and may be retained by Tesseract's browser cache. A first run therefore takes longer and uses several megabytes of browser cache.

## Verification

```bash
npm --workspace samples/wasm-local-ocr run test
npm --workspace samples/wasm-local-ocr run build
npm --workspace samples/wasm-local-ocr run package-solution
```

If an asset is blocked by CSP, missing from the package, or the browser cannot start the worker/WASM, the UI reports an engine error and displays no text. It never falls back to fabricated output.
