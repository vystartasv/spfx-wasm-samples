# Local PDF inspector

Select one PDF up to 25 MB. A dedicated worker lazily loads `@hyzyla/pdfium` 2.1.13, reports page count and metadata, and renders the first page where the browser asset path supports it. Bytes remain local and there is no SharePoint write or upload boundary.

Text redaction is deferred: the installed PDFium API exposes page text but no redaction/edit operation, so the sample does not fake a redacted output. No WASM performance benefit is claimed without measurements.

Run `npm test`, `npm run build`, or `npm run package-solution` from this directory.
