# Operating contract

Pick one sample. Read its README, architecture/limitations/benchmark docs, source, tests, package/config, and `sample.yml` before editing. Preserve unrelated worktree changes and do not reorganize samples.

Every sample keeps metadata with purpose, WASM/baseline, execution, network, SharePoint writes, privacy, limits, claims, maturity, and licensing. Claims are `VERIFIED`, `EXPECTED`, `EXPERIMENTAL`, or `NOT SUPPORTED`; without tenant/browser evidence maturity is at most L2. Evidence means a reproducible command or controlled browser run, never inference from a dependency README.

Canonical repository guidance lives under [docs/](docs/), including the metadata contract at [docs/standards/SAMPLE-CONTRACT.md](docs/standards/SAMPLE-CONTRACT.md) and the technical WASM security model at [docs/SECURITY.md](docs/SECURITY.md). The root [SECURITY.md](SECURITY.md) is for vulnerability reporting.

Prefer a native baseline, a dedicated worker for expensive/stateful work, a versioned typed RPC contract, bounded inputs, cancellation, visible engine/status/error, accessible localized UI, and explicit upload boundaries. Local storage, workers, WASM, hashes, and namespaces are not authority boundaries.

Do not fabricate timings, screenshots, tenant/browser support, privacy/security guarantees, offline durability, production readiness, or upload success. Do not add secrets, tenant data, telemetry, CDN dependencies, or SharePoint writes to a `writes:false` sample. Do not commit generated build/package output.

Before review run `npm ci`, `npm run check:coherence`, targeted and root `npm test`, `npm run build`, `npm run package-solution`, and `git diff --check`. Clean generated output and report exact warnings and unresolved deployment evidence. Do not commit or push unless explicitly requested.
