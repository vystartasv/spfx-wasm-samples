# Limitations

- Only English `eng` is packaged. Adding a language requires adding and verifying its trained-data package and increasing the shipped asset budget.
- The model (`eng` best) and LSTM WASM are multi-megabyte assets. The first run needs same-origin access to those assets and browser storage may cache them.
- Worker creation, `importScripts`, WebAssembly, cross-origin isolation details, and CSP can differ across SharePoint, Teams, and tenant-hosted workbenches. A blocked load is surfaced as an error; no OCR text is invented.
- Images are limited to 10 MiB. Large dimensions can still consume substantial memory inside Tesseract.
- Cancellation terminates the worker; an in-flight native recognition may finish at the engine boundary before the result is discarded.
- The sample does not promise accuracy, document layout fidelity, or legal/privacy compliance for a tenant. A host application remains responsible for its validation and governance boundary.
