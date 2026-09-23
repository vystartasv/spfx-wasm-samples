# SharePoint Change Radar

Targets SPFx 1.24.0; current packages remain pinned to published stable SPFx 1.23.2 because 1.24.0 is not published. Change Radar answers “what breaks if I move, retire, rename, or replace this page or URL?” by showing pages that directly or indirectly reference a selected target, including cycle and missing-reference warnings.

## Five-minute workflow

1. Run `npm install` at the repository root, then `npm --workspace samples/wasm-change-radar run start` for a SharePoint workbench, or use the root `start` conventions with a tenant workbench.
2. Leave **Demo fixture (verified local path)** selected. The fixture is deterministic and includes direct and indirect references, a cycle, a missing page, an external URL, a duplicate canonical URL, malformed/escaped content, and permission/throttle warnings.
3. Select a target, choose `retire`, `move`, `rename`, or `replace`, and provide a same-site destination for every action except retire.
4. Run the scan. Review the keyboard-navigable table, escaped context, summary counts, and warnings. **Export local JSON** only when you intentionally want a download; the export is not uploaded or persisted by this sample.

The **Current site (typed GET-only adapter stub)** scope documents the integration boundary but deliberately returns an explicit non-claim in this sample. It does not pretend that a local fixture is a tenant crawl.

## Architecture

React owns the controls, same-site URL validation, visible status/errors, cancellation intent, and local export. A versioned typed RPC sends bounded input to a dedicated worker. The worker validates envelopes, extracts references from untrusted content, normalizes URLs while preserving the managed path, traverses reverse reachability, detects cycles, and returns deterministic sorted results. Native TypeScript is the correctness oracle; no WASM engine is included.

The typed `SharePointReadOnlyAdapter` boundary describes bounded `GET` requests to the current site's `Site Pages` list. The checked-in implementation is a stub because tenant permissions, pagination, throttling, list shape, and completeness need controlled evidence before a real adapter is claimed. There is no Graph call, external fetch, upload, write, telemetry, or persistence path.

## Limits, privacy, and non-goals

Scans are bounded to 80 pages, 64 KiB of content per page, 50 extracted references per page, and five adapter page requests. Target and destination URLs must be HTTP(S), same-site, and within the current managed path. Query strings and fragments are removed for page identity. Reference context is a bounded excerpt and is rendered as text, not HTML.

This is impact evidence, not an authority decision. It does not discover every SharePoint list, library, web part, navigation surface, search relationship, audience, version, permission-hidden page, or Graph dependency. It does not update links, redirect pages, retire content, or guarantee that a proposed change is safe. Browser extensions, the host page, SharePoint logging, tenant authorization, and administrator instrumentation are outside this sample's privacy boundary.

## Evidence and verification

Repository tests cover URL normalization, managed-path validation, reference extraction, graph impact, cycles, warnings, RPC envelope validation and cancellation, stable export/hash/order, and the read-only adapter contract. Run from this directory:

```text
npm test
npm run build
npm run package-solution
```

These commands provide local repository evidence only. A controlled browser run and tenant run are still required to validate SPFx hosting, worker loading, browser support, permissions, throttling, actual Site Pages reads, and any future WASM implementation. No screenshot is included because no real tenant/browser screenshot exists.
