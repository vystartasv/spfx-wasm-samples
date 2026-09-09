# Local duplicate detector

Runnable SPFx 1.23.2 web part that selects files, reads them locally, and finds exact duplicate content by SHA-256 in a dedicated worker. The tested baseline is browser Web Crypto. No selected bytes are uploaded: this sample has no upload action, and the SharePoint page is only the host.

Run from the workspace with `npm run start:duplicate-detector`, or build and package with the root scripts. The **10,000-record fixture** is generated only after its button is pressed; it is deterministic and intentionally repeats 250 content values for reproducible non-network testing.

The optional WASM path is not bundled in this baseline. The result engine is always the measured engine, so it never reports WASM unless a future cleanly packaged implementation is actually invoked and measured.
