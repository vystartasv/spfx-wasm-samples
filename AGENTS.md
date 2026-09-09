# Agent routing guide

This repository contains self-contained SharePoint Framework (SPFx) samples that demonstrate browser-local WebAssembly, Web Workers, SQLite/DuckDB, OCR, duplicate detection, and explicit upload boundaries.

## Sources of truth

- Repository intent and sample inventory: [README.md](README.md)
- Contributor workflow: [CONTRIBUTING.md](CONTRIBUTING.md)
- Sample behavior, architecture, limits, and benchmarks: each sample's `README.md` and its `docs/` directory
- Implementation: the selected sample's `src/`
- Tests: the selected sample's `src/**/*.test.ts` and `src/**/*.test.tsx`
- Workspace scripts and versions: root and sample `package.json` files

## Bootstrap and verification

Use Node 22 (the package engine is `>=22.14.0 <23.0.0`) and run:

```sh
npm ci
npm run check:coherence
npm test
npm run build
npm run package-solution
git diff --check
```

Run a targeted workspace command while iterating, for example `npm --workspace samples/wasm-sqlite-cache test` or `npm --workspace samples/wasm-sqlite-cache run build`.

## Contribution boundaries

Agents are invited contributors. They may open focused pull requests or issues. Pick one sample, read its README and architecture/benchmark/limitations docs, inspect existing tests, make the narrowest useful change, add or update deterministic tests, and run targeted then root verification. Do not claim tenant validation, browser behavior, CSP, OPFS durability, SharePoint permissions, or performance results without evidence from that environment. Never fabricate benchmark numbers, screenshots, users, tenant data, or test results.

Never add secrets, tokens, tenant identifiers, production data, or credentials. Keep generated build/package output out of commits unless a sample explicitly tracks it; clean generated output before submitting. Preserve unrelated worktree changes and avoid broad refactors.
