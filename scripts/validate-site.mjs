import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const site = resolve(root, 'docs/site');
const required = ['index.html', 'styles.css', 'app.js', 'README.md'];
const failures = [];
for (const file of required) if (!existsSync(resolve(site, file))) failures.push('missing docs/site/' + file);

const read = file => readFileSync(resolve(site, file), 'utf8');
if (!failures.length) {
  const html = read('index.html');
  const css = read('styles.css');
  const js = read('app.js');
  for (const marker of ['<!doctype html>', '<html lang="en">', 'name="viewport"', 'href="styles.css"', 'src="app.js"', 'id="main-content"', 'id="theme-select"', 'id="change-radar"', 'id="sample-grid"']) {
    if (!html.includes(marker)) failures.push('index.html: missing ' + marker);
  }
  for (const marker of [':focus-visible', 'prefers-reduced-motion', 'max-width: 390px', 'max-width: 720px', 'max-width: 960px']) {
    if (!css.includes(marker)) failures.push('styles.css: missing ' + marker);
  }
  for (const id of ['wasm-change-radar', 'wasm-image-upload', 'wasm-local-data-plane', 'wasm-duckdb-analytics', 'wasm-duplicate-detector', 'wasm-local-ocr', 'wasm-smart-upload', 'wasm-sqlite-cache', 'wasm-qr-scanner', 'wasm-pdf-inspector']) {
    if (!js.includes("id: '" + id + "'")) failures.push('app.js: missing metadata for ' + id);
  }
  if ((js.match(/id: 'wasm-/g) || []).length !== 10) failures.push('app.js: expected exactly ten sample metadata entries');
  if (/<(?:script|link)[^>]+(?:src|href)=["']https?:/i.test(html)) failures.push('index.html: external runtime or stylesheet dependency found');
  if (/https?:\/\/(?:cdn\.|unpkg|jsdelivr|cdnjs\.)/i.test(html + '\n' + css + '\n' + js)) failures.push('site: CDN dependency found');
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exitCode = 1;
} else {
    console.log('Site OK: static files, responsive/accessibility markers, ten sample entries, and no CDN runtime checked.');
}
