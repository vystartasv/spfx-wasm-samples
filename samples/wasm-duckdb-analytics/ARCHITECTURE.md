# Architecture

The web part renders controls and measured result panels. AnalyticsClient creates one application Web Worker lazily. That worker owns fixture state and the DuckDB connection; the UI never imports or owns a database connection.

The fixture generator is deterministic (rowAt(index)) and lazy until load. The native baseline consumes the same generated rows. DuckDB receives the loaded rows as JSON, executes the fixed aggregation contract, and returns shaped results. Both engines report browser-measured duration and input row count.

SQLite remains the operational/sync database. This sample has no network calls, credentials, secrets, or tenant data.
