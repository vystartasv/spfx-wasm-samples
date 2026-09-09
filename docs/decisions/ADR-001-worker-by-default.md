# ADR-001: worker by default

Decision: expensive or stateful WASM engines run in a dedicated worker. Reason: preserve UI responsiveness and isolate engine ownership. Exception: a measured trivial path may stay in TypeScript.
