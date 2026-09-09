# Patterns

- UI and SharePoint host code stay in TypeScript; expensive/stateful engines live in one worker.
- Messages carry a version, operation, request id, bounded input, and shaped result/error.
- Load lazily, show the actual engine, retain a native fallback where one exists, and cancel/terminate work.
- Keep bytes local by default; make every network write an explicit UI action and metadata fact.
- Test pure contracts deterministically; treat browser, CSP, tenant, OPFS, and performance runs as separate evidence.
