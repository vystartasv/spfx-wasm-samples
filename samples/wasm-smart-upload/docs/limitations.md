# Limitations

- The browser must provide Web Crypto SHA-256. A missing Web Crypto implementation is an error, not a silent substitute.
- The worker fallback keeps the page usable, but hashing a large file on the main thread can block interaction; the UI labels this state.
- The sample holds the selected file and chunk hashes in browser memory and limits a file to 512 MB.
- The SharePoint path is deliberately limited to a small original-file upload through `Files/add`. It does not implement `StartUpload`, `ContinueUpload`, `FinishUpload`, or a Microsoft Graph upload session.
- A future remote adapter must define its session authorization, offset reconciliation, cancellation, retry policy, and server response validation before using `uploadResumable`.
- No WASM is bundled: the native Web Crypto implementation is the measured baseline, and WASM would be justified only by a measured workload that beats it without increasing deployment or privacy risk.
