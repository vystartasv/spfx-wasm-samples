# Contributing

This is an example-first SPFx repository. Contributions from humans and AI agents are welcome; focused fixes, tests, documentation, issues, and pull requests are useful.

## Setup

Prerequisites: Node 22 and npm. The supported engine is Node `>=22.14.0 <23.0.0`.

```sh
git clone https://github.com/vystartasv/spfx-wasm-samples.git
cd spfx-wasm-samples
npm ci
npm run check:coherence
```

Choose a sample under `samples/`, then read its `README.md`, `docs/`, source, tests, and `sample.yml`. Repository-wide guidance and the metadata contract are under [`docs/`](docs/). Workspaces are independent SPFx projects, while root scripts run the same operation across all nine samples.

## Development and verification

```sh
npm --workspace samples/wasm-sqlite-cache test
npm --workspace samples/wasm-sqlite-cache run build
npm --workspace samples/wasm-sqlite-cache run package-solution

npm test
npm run build
npm run package-solution
git diff --check
```

Heft/SPFx may print third-party, legacy, or environment-specific warnings. Treat failures as failures; document warnings with their file and command. Current known warning classes include dynamic dependency analysis in third-party worker packages and legacy nullability warnings in the local-data-plane sample. They are not evidence of tenant or browser validation.

Packages and builds create generated output. Clean it with the sample's `npm run clean` command (or the relevant Heft clean command) before review, and do not commit generated output unless the sample already requires it.

## Branches, pull requests, and evidence

Use a focused branch and commit. A pull request should explain the sample, user-visible or contract change, tests run, remaining limitations, and any expected warnings. Ask a repository owner to perform tenant validation for changes involving SharePoint, Graph, CSP, permissions, OPFS, or browser packaging; local tests cannot establish those facts.

Screenshots are optional and must come from a real run, contain no secrets or tenant data, and state the browser/environment and scenario. Never present invented measurements or screenshots as evidence.

Before requesting review, check localization, accessibility labels, error paths, worker cancellation, generated files, secret exposure, and the sample's README/limitations documentation. Do not include credentials, access tokens, cookies, private keys, tenant exports, or production data.

Agents should also read [AGENTS.md](AGENTS.md) for routing and contribution boundaries.
