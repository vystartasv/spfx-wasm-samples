# Limitations

- PDF validation is byte/name bounded; malformed, encrypted, or unusual PDFs can still fail in PDFium.
- First-page rendering depends on the PDFium render callback/host asset policy and is not a PNG upload or export path.
- Text redaction is deferred until an engine/API with a verifiable edit operation is selected.
- No WASM-vs-native performance result is claimed.
