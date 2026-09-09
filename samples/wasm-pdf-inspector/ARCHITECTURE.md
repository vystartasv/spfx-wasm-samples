# Architecture

The component enforces the PDF extension/byte limit and owns status, errors, accessibility, and per-instance IDs. One validated request goes to a short-lived worker. The worker calls the installed PDFium API (`PDFiumLibrary.init`, `loadDocument`, `getPageCount`, `getPage`, `render`) and destroys document/library resources in `finally`. Cancellation terminates the client worker.

PDFium is bundled as a same-origin WASM asset by webpack. Rendering is exposed as bounded metadata in this minimal sample; text redaction is intentionally not implemented because the inspected API does not provide it.
