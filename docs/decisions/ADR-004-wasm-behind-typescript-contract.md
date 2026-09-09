# ADR-004: WASM behind a TypeScript contract

Decision: TypeScript owns validation, cancellation, accessibility, and shaped results; WASM stays behind a versioned worker contract. Reason: the UI should not depend on engine handles or ABI details.
