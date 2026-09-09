# Lessons from Lightspeed WASM and local SLM work

Reviewed from the local Lightspeed repository and its history on 2026-09-09.

## WASM in SPFx

Lightspeed's working image encoder uses a small, explicit integration boundary:

1. Import the `.wasm` file as a URL.
2. Override the SPFx Webpack configuration with a `type: 'asset/resource'` rule.
3. Ship the emitted binary with client-side assets so it remains same-origin.
4. Fetch and compile the binary explicitly, then initialise the codec.
5. Reach the codec through a dynamic import and fall back when WebAssembly, fetch, CSP, or codec initialisation fails.

Do not enable Webpack `asyncWebAssembly` by default: the Lightspeed notes document incompatibility with SPFx's AMD output. Do not claim tenant compatibility until the emitted asset, worker, CSP, and SharePoint app-catalog deployment are tested.

## Local SLM work

The historical local summarisation feature used the same operational rules:

- no model download until the feature is selected and used;
- feature detection and explicit fallback;
- report the model, actual execution device, cache state, load time, inference time, and trimmed context;
- keep Node-only dependencies out of browser bundles;
- never imply a local model ran when the result came from another path.

That feature was subsequently removed. This repository keeps the lessons and evidence boundary, not the removed feature or its unverified performance claims.

## Application here

The native worker path remains the fallback. This slice applies the same boundary: `@jsquash/jpeg` 1.6.0 is loaded only by a separate lazy worker, the emitted `.wasm` is fetched and compiled explicitly, and browser-native encoding remains available for worker startup, WebAssembly, fetch/CSP, codec, and encode failures. The UI reports measured values and warnings without a performance conclusion. The repository build verifies packaging; tenant CSP and runtime behavior remain unverified.
