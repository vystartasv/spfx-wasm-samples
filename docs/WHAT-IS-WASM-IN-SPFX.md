# What WASM is in SPFx

WASM is a portable binary target executed by the browser. An SPFx web part can bundle a WASM module as a client asset, load it lazily, and call it from TypeScript—usually inside a worker.

It is useful for a mature specialized engine that is difficult or costly to reproduce in TypeScript: codecs, OCR, SQL, analytical scans, and document inspection. It does not provide authorization, encryption, isolation from the host, network access, or automatic performance wins.

The unit of adoption is a measured user task, not the presence of a `.wasm` file. Keep a native baseline and record loading, memory, worker, CSP, asset, license, and fallback costs.
