# Benchmarks and evidence

This sample intentionally does not publish benchmark values. Browser, CPU, memory pressure, WASM compilation, SharePoint hosting, and CSP affect results.

Evidence is produced by a run:

1. Load the 100,000-row deterministic fixture.
2. Run aggregation after the fixture is loaded.
3. Record the displayed native and DuckDB durations, input row counts, groups, query text, load status, and any error.
4. Repeat in the target browser/tenant if making a workload decision.

The meaningful gate is result parity plus a measured scan/aggregation benefit that justifies DuckDB's download, memory, and lifecycle costs. DuckDB is optional and should not be introduced for operational CRUD or sync.

Known boundary: the test suite proves deterministic generation, native result shaping, SQL contract, parity-shaped data, and failure state. It does not claim a tenant performance result or prove every browser CSP policy.
