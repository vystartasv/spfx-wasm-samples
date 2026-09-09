# Architecture

`WasmDuplicateDetector.tsx` owns accessible controls and presentation. `DuplicateDetectorClient` owns a versioned RPC channel to one dedicated worker. The worker validates requests, uses `crypto.subtle.digest('SHA-256', ...)`, checks cancellation between files, and returns shaped measurements. `duplicateDetector.ts` contains pure validation, fixture, grouping, and accounting functions used by tests.

Privacy boundary: selected `File` bytes are copied into worker messages and remain in the browser process. There is no network request or upload control. Browser extensions, the host page, and the browser itself remain outside this sample’s control.
