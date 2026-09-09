# Evidence and limitations

- The baseline is browser Web Crypto SHA-256, not a WASM hash.
- Exact equality is inferred from SHA-256. A cryptographic collision is theoretically possible; this sample does not perform a second byte comparison.
- Files are fully read into memory before worker transfer and bounded to 100 files, 50 MB per file, and 200 MB total.
- Cancellation rejects the RPC and the UI can terminate the worker on unmount; a browser may finish an in-flight digest before the cancellation boundary.
- A missing `crypto.subtle`, malformed RPC, unsupported version, validation failure, worker error, and cancellation are surfaced as error states.
