# Third-party notices

Pinned native/WASM-derived dependencies and their asset boundaries. `npm run check:coherence` checks that every metadata entry has a matching dependency/version/license/source here and that its sample notice exists.

| Dependency/version | License | Source | Used by | Asset/notice location |
|---|---|---|---|---|
| `@jsquash/jpeg@1.6.0` | Apache-2.0 | https://github.com/jamsinclair/jSquash | image upload | package `LICENSE` |
| `@sqlite.org/sqlite-wasm@3.53.4-build1` | Apache-2.0 (package) | https://github.com/sqlite/sqlite-wasm | local data plane, SQLite cache | packaged WASM; package notice |
| `@duckdb/duckdb-wasm@1.32.0` | MIT | https://github.com/duckdb/duckdb-wasm | analytics | packaged WASM; package notice |
| `tesseract.js@7.0.0` | Apache-2.0 | https://github.com/naptha/tesseract.js | local OCR | packaged core/WASM; package `LICENSE.md` |
| `@tesseract.js-data/eng@1.0.0` | MIT | https://github.com/naptha/tessdata | local OCR | packaged trained data; package metadata |
| `@undecaf/zbar-wasm@0.11.0` | LGPL-2.1-or-later | https://github.com/undecaf/zbar-wasm | QR scanner | sample `LICENSE-THIRD-PARTY.md`; packaged `dist/zbar.wasm` |
| `@hyzyla/pdfium@2.1.13` | MIT | https://github.com/hyzyla/pdfium | PDF inspector | sample `LICENSE-THIRD-PARTY.md`; packaged `dist/pdfium.wasm` |
| embedded PDFium in the wrapper | upstream PDFium BSD-style licensing and notices | https://pdfium.googlesource.com/pdfium/ | PDF inspector | wrapper-distributed PDFium asset; review pinned upstream notices before redistribution changes |

SPFx, React, Fluent UI, TypeScript, and build tools retain their package notices. This file records native/WASM-derived assets, not a replacement for complete package notice text.

Redistribution review: run `npm ci`, verify the installed package versions and lockfile integrity, inspect each package's `LICENSE`/`LICENSE.md`, README, and the imported WASM file under `dist/`, then compare the package source and embedded-engine notices with the URLs above. For PDFium, the npm wrapper does not include a separate upstream notice file; identify the PDFium revision used by the package/source build and review that revision's upstream `LICENSE` and notice files before redistributing a changed asset. Record any changed asset hash and retain the corresponding source/notices with the release.

The installed 0.11.0 ZBar asset is 238653 bytes, SHA-256 `438f95e4b5d122c4c2a8da2b72ad19faa4ba4e541f473dcae0371e4cfc8159ee`. The installed 2.1.13 PDFium asset is 3988829 bytes, SHA-256 `71aec412a303a0405baee21c3d6d3f30ad2033dc02444130fe476be3976e2d09`; these fingerprints are review evidence for the package assets, not a substitute for the license review.
