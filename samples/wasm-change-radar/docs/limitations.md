# Limitations and evidence

- The deterministic fixture is repository evidence for the local algorithm, not evidence that a tenant's pages, permissions, or links are complete.
- Current-site mode reads `Site Pages` fields only. It does not crawl every list, library, web part, search index, navigation surface, version, audience, or Graph relationship.
- The adapter stops after five pages of at most 80 records total and reports permission, HTTP, and throttle warnings.
- URL normalization keeps the managed site path and strips fragments and query strings. This is a useful page-impact heuristic, not a SharePoint URL authority decision.
- Context is a bounded excerpt of untrusted page content. React text rendering escapes it; the sample does not interpret HTML.
- No WASM engine is included. The native TypeScript implementation is the correctness oracle and there is no performance comparison claim.
- Maturity is L2. No controlled browser or tenant evidence is included.
