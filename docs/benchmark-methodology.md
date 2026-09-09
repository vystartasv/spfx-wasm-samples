# Benchmark methodology

Milestone 1 reports measurements from the browser run that processed the selected files. It does not ship benchmark results.

## Deterministic fixture

Create a small SVG fixture without a binary asset:

```sh
node benchmarks/generate-fixture.mjs
```

The generated `benchmarks/fixture-128x96.svg` has fixed dimensions, colors, and bytes. Run the sample in the local workbench, select the fixture (or a fixed set of copies), and record the displayed engine, input bytes, output bytes, percentage, and duration. The generated file is ignored and must not be committed.

## Procedure

1. Use the same browser version, device, power mode, and workbench session for each comparison.
2. Clear the selection, select the same files, and run optimization three times after one warm-up run.
3. Record every displayed result; do not average values that were not actually observed.
4. Compare a future self-contained WASM codec against the native worker using identical files, resize limit, output type, quality, and worker lifecycle.
5. Report median duration and all input/output byte totals, plus the browser and device. A result is evidence for this fixture only, not a universal claim that WASM is faster.

No tenant benchmark or screenshot is included in Milestone 1.
