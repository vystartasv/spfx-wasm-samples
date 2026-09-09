# Architecture

1. React owns selection, accessible status/error messaging, cancellation, and the explicit upload buttons.
2. `smartUpload.worker.ts` is the normal preparation path. It calls the shared core contract and returns transferable result data.
3. `smartUpload.ts` defines validation, chunk ranges, SHA-256 formatting, deterministic retry identity, fixture generation, and the native fallback implementation. A failed or unavailable worker falls back to this browser-native path and labels the warning.
4. `WasmSmartUploadWebPart.ts` is the only SharePoint host integration. Its adapter uses `SPHttpClient` for small files and does not expose a fake chunked remote path.

Chunk identity is `fileHash:index:offset:size:chunkHash`. It contains no random session state, so a future resumable adapter can safely retry the same chunk. Chunk payload bytes are sliced only for local hashing; they are not sent by Prepare or by the local simulation.
