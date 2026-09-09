# Architecture

The React component validates local selection and image dimensions. Native `BarcodeDetector` is the explicit baseline. A failed or unavailable native path sends one validated request to a short-lived worker. The worker decodes pixels with ZBar's documented `scanImageData`, lazily locating the packaged `zbar.wasm` asset. The client terminates the worker on cancel/unmount.

Results are shaped to type/data/engine/time/bytes/warnings. No upload adapter exists. Browser support, CSP, worker asset serving, and native detector behavior remain deployment checks.
