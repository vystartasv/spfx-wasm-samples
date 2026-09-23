# Architecture

The React web part owns scope controls, same-site validation, the proposed action, accessibility, cancellation intent, and export. `ChangeRadarClient` owns a versioned request/response channel and suppresses stale results. The worker validates bounded envelopes and calls the native TypeScript graph oracle. The oracle normalizes URLs, extracts references from untrusted content, builds the reverse graph, detects cycles, and sorts results deterministically.

Demo fixture mode is the default and never uses the network. The optional `SharePointReadOnlyAdapter` reads only the current site's Site Pages list with bounded GET pagination. It is an integration boundary, not tenant evidence: permissions, list customizations, throttling, page coverage, CSP, browser behavior, and deployment must be checked in a controlled tenant.

No local storage, IndexedDB, cookies, telemetry, Graph API, external fetch, upload, or SharePoint write exists in this sample. Export creates a browser download only after the user presses the export button.
