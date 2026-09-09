# Local QR and barcode scanner

Select up to 8 still images (10 MB and 16 megapixels per image). The web part tries the browser `BarcodeDetector` API, then falls back to `@undecaf/zbar-wasm` 0.11.0 in a dedicated worker. Files stay in the browser; this sample has no camera, SharePoint write, or CDN path.

Run `npm test`, `npm run build`, or `npm run package-solution` from this directory. No performance claim is made: the displayed engine is the path actually used.

ZBar is LGPL-2.1-or-later; see [LICENSE-THIRD-PARTY.md](LICENSE-THIRD-PARTY.md).
