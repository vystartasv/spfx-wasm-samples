# Browser support

Support is capability-based and sample-specific: workers, WebAssembly, module workers, `createImageBitmap`, `OffscreenCanvas`, `BarcodeDetector`, Web Crypto, OPFS, and CSP each vary by browser and embedding context. The repository does not claim all-browser support.

Feature-detect required APIs, show a useful error or fallback, and validate packaged assets in the target workbench and tenant. Jest/build success is not browser evidence.
