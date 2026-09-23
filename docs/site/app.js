const REPOSITORY = 'https://github.com/vystartasv/spfx-wasm-samples';

// Keep this snapshot aligned with each sample.yml. The site is intentionally static so it can run without a build or runtime dependency.
const samples = [
  { id: 'wasm-change-radar', title: 'SharePoint Change Radar', purpose: 'Review read-only page and URL impact before retiring, moving, renaming, or replacing a target.', used: false, engine: 'None — native TypeScript URL graph analysis', baseline: 'Native TypeScript URL graph analysis', execution: 'Versioned typed RPC to a dedicated worker; the worker extracts references, traverses reverse reachability, detects cycles, and returns deterministic results.', network: 'Demo fixture makes no network request. A typed current-site GET-only adapter boundary is an explicit stub; no Graph, external fetch, telemetry, or persistence.', writes: false, boundary: 'Typed read-only current-site adapter boundary only; the checked-in adapter is a stub with no SharePoint write path.', privacy: 'Page URLs and content are processed in the browser and are not persisted or sent to external services. Tenant permissions, browser extensions, host instrumentation, and SharePoint logging remain outside this sample’s control.', limits: '80 pages; 64 KiB per page; 50 references per page; 5 adapter page requests; same-site managed path.', claims: [['VERIFIED', 'The deterministic fixture, URL normalization, reference extraction, graph impact, cycle detection, warnings, stable export, and worker contract are covered by repository tests.'], ['VERIFIED', 'The checked-in adapter contract creates only bounded same-site GET request descriptions and has no write or Graph operation.'], ['EXPECTED', 'A dedicated worker keeps extraction and graph traversal off the UI thread when the packaged web part runs.'], ['NOT SUPPORTED', 'The current-site adapter is a typed stub; tenant completeness, permission visibility, browser compatibility, production information architecture decisions, and any WASM performance advantage are not claimed.']], maturity: 'L2', featured: true },
  { id: 'wasm-image-upload', title: 'WASM image upload', purpose: 'Optimize selected images locally and upload only after explicit user action.', used: true, engine: '@jsquash/jpeg 1.6.0', baseline: 'Browser-native image worker', execution: 'Dedicated workers; measured engine and bytes are returned per run.', network: 'Only the explicit SharePoint upload uses network.', writes: true, boundary: 'Site Assets via SPFx REST adapter', privacy: 'Selected bytes stay in the browser until explicit upload; host telemetry is outside this sample.', limits: 'Multiple images; output is JPEG, max dimension 2048, quality 0.82.', claims: [['VERIFIED', 'Code reports the engine actually used and has a native fallback.'], ['NOT SUPPORTED', 'No claim that WASM is faster or that tenant upload behavior is validated.']] },
  { id: 'wasm-local-data-plane', title: 'Local data plane', purpose: 'Experiment with a worker-owned SQLite-WASM local store and explicit sync contracts.', used: true, engine: '@sqlite.org/sqlite-wasm 3.53.4-build1', baseline: 'Native in-memory adapter', execution: 'One worker owns SQLite, migrations, transactions, cursors, and local writes.', network: 'Deterministic mocks only; no real Graph or SharePoint request.', writes: false, boundary: 'Mock adapter contracts only', privacy: 'Fixture data is local; storage namespace is application isolation, not authorization.', limits: 'Milestone 1 mock data plane; OPFS and tenant behavior require deployment evidence.', claims: [['VERIFIED', 'Tests cover local contracts and deterministic mock behavior.'], ['EXPERIMENTAL', 'OPFS durability, scale, and real sync remain deployment experiments.']] },
  { id: 'wasm-duckdb-analytics', title: 'DuckDB-WASM analytics', purpose: 'Compare a native TypeScript aggregation with a worker-owned DuckDB-WASM aggregation.', used: true, engine: '@duckdb/duckdb-wasm 1.32.0', baseline: 'Native TypeScript aggregation over the same fixture', execution: 'One lazy worker owns the DuckDB connection and reports live measurements.', network: 'Fixture is generated locally; no network or credentials.', writes: false, boundary: 'No SharePoint integration', privacy: 'Fixture rows remain in the browser process.', limits: 'Fixed deterministic aggregation contract; 100,000-row fixture is not a general benchmark.', claims: [['VERIFIED', 'Both paths use the same fixture and expose measured durations.'], ['EXPERIMENTAL', 'Any performance conclusion requires controlled browser/device runs.']] },
  { id: 'wasm-duplicate-detector', title: 'Local duplicate detector', purpose: 'Group selected files with equal SHA-256 content locally.', used: false, engine: 'Browser Web Crypto SHA-256', baseline: 'Browser Web Crypto SHA-256', execution: 'Dedicated worker validates requests and checks cancellation between files.', network: 'No network.', writes: false, boundary: 'No SharePoint integration', privacy: 'Selected file bytes remain in the browser process.', limits: 'Exact-content duplicates only; fixture mode is deterministic.', claims: [['VERIFIED', 'Hashing and grouping use browser Web Crypto and deterministic tests.'], ['NOT SUPPORTED', 'No claim of fuzzy or perceptual duplicate detection.']] },
  { id: 'wasm-local-ocr', title: 'Local OCR', purpose: 'Recognize one selected local image with packaged Tesseract.js assets in a worker.', used: true, engine: 'Tesseract.js 7.0.0 / packaged LSTM core', baseline: 'No native OCR baseline; engine failure is surfaced', execution: 'Short-lived worker per run with progress and cancellation.', network: 'No application network path; assets are packaged and same-origin.', writes: false, boundary: 'No SharePoint integration', privacy: 'Image bytes are sent only to the local worker; output is untrusted text.', limits: 'One image up to 10 MiB; English model only; accuracy and layout are not promised.', claims: [['VERIFIED', 'The worker returns engine output or an explicit error; it does not fabricate text.'], ['EXPERIMENTAL', 'Browser/CSP packaging and recognition quality need environment evidence.']] },
  { id: 'wasm-smart-upload', title: 'Smart upload preparation', purpose: 'Hash and deterministically chunk one selected file locally before an optional upload.', used: false, engine: 'Browser Web Crypto SHA-256', baseline: 'Browser Web Crypto SHA-256', execution: 'Dedicated worker with cancellation and native fallback.', network: 'Preparation is local; the optional small-file upload uses SharePoint REST.', writes: true, boundary: 'Explicit Site Assets upload adapter', privacy: 'Selected bytes remain local until the user activates upload.', limits: 'One file; local preparation capped at 512 MB; remote adapter is deliberately small-file only.', claims: [['VERIFIED', 'Preparation does not upload and reports measured browser-run timings.'], ['NOT SUPPORTED', 'No SharePoint resumable upload implementation or WASM speed claim.']] },
  { id: 'wasm-sqlite-cache', title: 'SQLite list cache', purpose: 'Demonstrate a worker-owned SQLite-WASM cache with local CRUD and simulated sync states.', used: true, engine: '@sqlite.org/sqlite-wasm 3.53.4-build1', baseline: 'Sample-local memory store', execution: 'One worker owns the store; OPFS is preferred with visible memory fallback.', network: 'No network; sync is simulated.', writes: false, boundary: 'SharePoint-list-shaped local data only', privacy: 'Local cache data is not an authorization or security boundary.', limits: 'One list-style dataset; conflicts remain visible and are not auto-merged.', claims: [['VERIFIED', 'Schema, local CRUD, outbox markers, and simulated outcomes are tested.'], ['NOT SUPPORTED', 'No claim of offline durability, tenant compatibility, or real sync.']] },
  { id: 'wasm-qr-scanner', title: 'Local QR and barcode scanner', purpose: 'Scan selected still images with native BarcodeDetector and a visible packaged ZBar fallback.', used: true, engine: '@undecaf/zbar-wasm 0.11.0', baseline: 'Browser BarcodeDetector when available and successful', execution: 'Native path first; fallback uses a short-lived cancellable worker.', network: 'No network, camera, CDN, or upload path.', writes: false, boundary: 'No SharePoint integration', privacy: 'Selected image bytes stay within this sample’s browser code boundary; host telemetry is outside its control.', limits: 'Still images only; up to 8 files, 10 MiB and 16 megapixels each.', claims: [['VERIFIED', 'The UI identifies BarcodeDetector or ZBar WASM as the engine used.'], ['NOT SUPPORTED', 'Camera scanning, universal browser support, and performance superiority are not claimed.']] },
  { id: 'wasm-pdf-inspector', title: 'Local PDF inspector', purpose: 'Inspect metadata and preview a selected local PDF with packaged PDFium WASM.', used: true, engine: '@hyzyla/pdfium 2.1.13', baseline: 'No alternate PDF engine; failure is surfaced', execution: 'Bounded request to a worker; PDFium resources are destroyed in finally and cancellation terminates the worker.', network: 'No network or upload path.', writes: false, boundary: 'No SharePoint integration', privacy: 'Selected PDF bytes remain in the browser code boundary; host telemetry is outside this sample.', limits: 'One PDF up to 25 MB; malformed/encrypted files may fail; first-page rendering only.', claims: [['VERIFIED', 'The sample inspects and previews locally and reports errors.'], ['NOT SUPPORTED', 'Text redaction/editing is not implemented and no performance or browser-universality claim is made.']] }
];

const escapeHtml = value => String(value).replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]));
const sampleGrid = document.querySelector('#sample-grid');
const sampleEmpty = document.querySelector('#sample-empty');
const sampleCount = document.querySelector('#sample-count');
const sampleSearch = document.querySelector('#sample-search');
const sampleFilter = document.querySelector('#sample-filter');

function readmeUrl(sample) {
  return REPOSITORY + '/blob/main/samples/' + sample.id + '/README.md';
}

function claimClass(status) {
  return status === 'EXPERIMENTAL' ? 'experimental' : status === 'EXPECTED' ? 'expected' : status === 'NOT SUPPORTED' ? 'unsupported' : '';
}

function cardTemplate(sample) {
  const tags = (sample.used ? '<span class="tag">WASM INCLUDED</span>' : '<span class="tag native">NO WASM</span>') + '<span class="tag ' + (sample.writes ? 'write' : '') + '">' + (sample.writes ? 'SHAREPOINT WRITE' : 'NO SHAREPOINT WRITE') + '</span>';
  const claims = sample.claims.map(([status, text]) => '<span class="claim ' + claimClass(status) + '"><b>' + escapeHtml(status) + '</b>' + escapeHtml(text) + '</span>').join('');
  return '<article class="sample-card' + (sample.featured ? ' sample-card-featured' : '') + '"><div class="sample-card-header"><h3>' + escapeHtml(sample.title) + '</h3><span class="maturity">' + escapeHtml(sample.maturity || 'L2') + ' / LOCAL</span></div><p class="sample-purpose">' + escapeHtml(sample.purpose) + '</p><div class="tag-row">' + tags + '</div><dl class="sample-facts"><div><dt>Engine path</dt><dd>' + escapeHtml(sample.engine) + '</dd></div><div><dt>Baseline</dt><dd>' + escapeHtml(sample.baseline) + '</dd></div><div><dt>Network</dt><dd>' + escapeHtml(sample.network) + '</dd></div><div><dt>Input boundary</dt><dd>' + escapeHtml(sample.limits) + '</dd></div></dl><details><summary>Claims &amp; boundary</summary><div class="detail-body"><p><strong>Execution:</strong> ' + escapeHtml(sample.execution) + '</p><p><strong>Privacy:</strong> ' + escapeHtml(sample.privacy) + '</p><p><strong>SharePoint:</strong> ' + escapeHtml(sample.boundary) + '</p>' + claims + '<a class="sample-link" href="' + readmeUrl(sample) + '" rel="noreferrer">Read sample README ↗</a></div></details></article>';
}

function renderSamples() {
  const query = sampleSearch.value.trim().toLowerCase();
  const filter = sampleFilter.value;
  const visible = samples.filter(sample => {
    const searchable = [sample.title, sample.purpose, sample.engine, sample.baseline, sample.network, sample.boundary].join(' ').toLowerCase();
    const matchesFilter = filter === 'all' || (filter === 'wasm' && sample.used) || (filter === 'native' && !sample.used) || (filter === 'writes' && sample.writes);
    return matchesFilter && searchable.includes(query);
  });
  sampleGrid.innerHTML = visible.map(cardTemplate).join('');
  sampleEmpty.hidden = visible.length !== 0;
  sampleCount.textContent = visible.length + ' of ' + samples.length + ' samples';
}

function initTheme() {
  const select = document.querySelector('#theme-select');
  let saved = 'auto';
  try {
    const stored = localStorage.getItem('spfx-wasm-theme');
    if (stored === 'light' || stored === 'dark' || stored === 'auto') saved = stored;
  } catch {}
  select.value = saved;
  select.addEventListener('change', () => {
    const theme = select.value;
    if (theme === 'auto') document.documentElement.removeAttribute('data-theme');
    else document.documentElement.dataset.theme = theme;
    try { localStorage.setItem('spfx-wasm-theme', theme); } catch {}
  });
}

sampleSearch.addEventListener('input', renderSamples);
sampleFilter.addEventListener('change', renderSamples);
document.querySelector('.copy-button').addEventListener('click', async event => {
  const button = event.currentTarget;
  try {
    await navigator.clipboard.writeText(button.dataset.copy);
    button.textContent = 'Copied';
    setTimeout(() => { button.textContent = 'Copy'; }, 1400);
  } catch {
    button.textContent = 'Select above';
  }
});

initTheme();
renderSamples();
