# WASM loading

Prefer a lazy same-origin asset path with a dedicated worker. Verify the emitted asset, MIME/CSP policy, URL resolution, initialization failure, and cleanup. Keep `asyncWebAssembly`/bundler behavior explicit in sample config; packaging success alone is not runtime evidence.
