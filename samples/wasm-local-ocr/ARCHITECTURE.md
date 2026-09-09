# Architecture

`WasmLocalOcr.tsx` owns selection, accessibility status, limits, and display. `client.ts` creates one short-lived RPC worker per run. `ocr.worker.ts` validates the versioned request, lazily creates Tesseract.js with packaged URLs, forwards status/progress, and shapes only `result.data.text` and `result.data.confidence` into the response.

RPC messages use version `1`: `recognize`, `status`, `result`, `cancel`, `cancelled`, and `error`. Cancellation terminates the Tesseract worker and clears the engine so a later run cannot reuse a half-cancelled instance.

Webpack emits the Tesseract browser worker, LSTM core JavaScript/WASM, and `eng.traineddata.gz` under the solution's client-side assets. No CDN URL is configured. The model is lazy and browser-cacheable; cache contents are local to the browser and are not an upload path.

The tenant validation boundary is the browser and its deployment CSP: this sample proves bytes do not leave the page through its own code, but cannot override tenant extensions, browser policies, a compromised host, or administrator-managed telemetry. Treat OCR output as untrusted text.
