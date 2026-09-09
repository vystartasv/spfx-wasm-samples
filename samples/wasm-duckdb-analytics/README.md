# DuckDB-WASM analytics

Runnable SPFx 1.23.2 sample comparing a native TypeScript aggregation with an optional DuckDB-WASM aggregation. The fixture contains 100,000 deterministic rows and is generated only after the user presses **Generate/load fixture**.

SQLite remains the operational and sync database. DuckDB is not a replacement for it: this sample demonstrates when a measured scan/aggregation workload can justify an analytical engine.

## Run

From the repository root:

    npm ci
    npm test
    npm run build:duckdb-analytics
    npm run package:duckdb-analytics
    npm --workspace samples/wasm-duckdb-analytics run start

Open the local workbench and add **DuckDB analytics**. Load the fixture, run the aggregation, and compare the measured durations, row counts, query text, and result groups. No benchmark number is prefilled.

## Packaging evidence

The official @duckdb/duckdb-wasm package is used. Webpack emits its MVP worker and WASM module as same-origin asset/resource client assets; the sample does not use a CDN or tokens. The application worker loads lazily on the first fixture action and owns the DuckDB connection. The generated package is the evidence that SPFx Heft/Webpack accepted those assets.

If a tenant CSP or browser cannot load the assets, the UI reports the failure and keeps the native baseline available. That fallback is a tested native path, not a fabricated DuckDB result.
