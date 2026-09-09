# WASM security model

WebAssembly executes inside the browser’s origin and inherits the page’s authority. A worker can improve responsiveness and contain engine ownership, but it is not a security boundary against the host page, extensions, administrator instrumentation, or compromised dependencies.

Validate message envelopes and bounded inputs at the worker boundary. Treat decoded text, document metadata, and image symbols as untrusted output. Keep bytes local by default, make uploads explicit, and rely on SharePoint/Graph authorization, tenant policy, CSP, dependency review, and server-side validation for security decisions.

For vulnerability reporting, use the root [SECURITY.md](../SECURITY.md).
