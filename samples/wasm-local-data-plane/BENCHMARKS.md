# Benchmarks

The benchmark service and UI measure: cold hydration, warm local query, zero-change sync, 1/10/100-change sync when a change fixture is supplied, filter, sort, cross-source join, offline read, optimistic write, reconnect, and conflict. A measurement records duration, rows, request count, response bytes, and database bytes when a backend can report them. The current UI exposes the warm/cold actions and reports values from the live run; other scenario harnesses are intentionally represented by the adapter/sync contracts until their transport is real.

The conventional baseline is competent TypeScript over the same generated fixture. It performs the same filter, sort, and email-normalized join and reports its own measured duration. It is not deliberately crippled, and this repository contains no invented timing, row, network, or DB-size values.

## Procedure

1. Run `npm ci` and `npm run test:local-data-plane`.
2. Start the sample, record browser/version, SPFx version, tenant/site or mock mode, storage status, and whether the browser is online.
3. Clear data, run Cold hydrate once, then Warm local query at least five times; retain raw output rather than only an average.
4. Run zero-change sync, filtered/sorted/join queries, offline read, optimistic write, reconnect, and conflict simulation. Record failures separately.
5. Compare against a baseline run with the same fixture size and query options. Do not generalize from mock to tenant.

## Evidence table

| Scenario | Local measured | Baseline measured | Requests/bytes | Rows | DB bytes | Notes |
|---|---|---|---|---:|---:|---|
| Not recorded in repository | pending browser run | pending browser run | pending | pending | pending | No numbers are claimed |

Decision gate: GO/MODIFY/STOP is in the sample README. A result is not a performance claim until the environment, raw measurements, and repeatability are recorded.
