import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { validateMetadata } from './validate-metadata.mjs';
import { renderMatrix, verifyGeneratedReadme } from './generate-readme.mjs';
import { validateNotices } from './validate-notices.mjs';

const root = process.cwd();
const rootPackage = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));
const failures = [];
const workspaces = rootPackage.workspaces;
const requiredDocs = ['docs/WHAT-IS-WASM-IN-SPFX.md', 'docs/WHEN-TO-USE-WASM.md', 'docs/PATTERNS.md', 'docs/WASM-COST-MODEL.md', 'docs/SECURITY.md', 'docs/BENCHMARKING.md', 'docs/BROWSER-SUPPORT.md', 'docs/LICENSING.md', 'docs/architecture/PRINCIPLES.md', 'docs/architecture/WORKER-CONTRACT.md', 'docs/architecture/WASM-LOADING.md', 'docs/standards/SAMPLE-CONTRACT.md', 'docs/standards/CLAIMS.md', 'docs/standards/MATURITY.md', 'docs/standards/ACCESSIBILITY.md', 'docs/standards/sample.schema.json', 'docs/decisions/ADR-001-worker-by-default.md', 'docs/decisions/ADR-002-native-baseline.md', 'docs/decisions/ADR-003-explicit-write-boundary.md', 'docs/decisions/ADR-004-wasm-behind-typescript-contract.md'];
for (const document of requiredDocs) if (!existsSync(resolve(root, document))) failures.push(`missing canonical document ${document}`);
const containsTest = directory => readdirSync(directory, { withFileTypes: true }).some(entry => entry.isDirectory()
  ? containsTest(resolve(directory, entry.name))
  : /\.test\.tsx?$/.test(entry.name));

for (const workspace of workspaces) {
  const directory = resolve(root, workspace);
  const packagePath = resolve(directory, 'package.json');
  if (!existsSync(packagePath)) { failures.push(`${workspace}: missing package.json`); continue; }
  const sample = JSON.parse(readFileSync(packagePath, 'utf8'));
  for (const required of ['README.md', 'src', 'sample.yml']) if (!existsSync(resolve(directory, required))) failures.push(`${workspace}: missing ${required}`);
  const loc = resolve(directory, 'src/webparts');
  if (!existsSync(loc)) { failures.push(`${workspace}: missing src/webparts`); continue; }
  const localizedWebparts = readdirSync(loc, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name)
    .sort()
    .filter(name => existsSync(resolve(loc, name, 'loc/en-us.js')) && existsSync(resolve(loc, name, 'loc/mystrings.d.ts')));
  if (localizedWebparts.length !== 1) failures.push(`${workspace}: expected one localized webpart, found ${localizedWebparts.join(', ') || 'none'}`);
  for (const script of ['test', 'build', 'package-solution']) if (!sample.scripts?.[script]) failures.push(`${workspace}: missing ${script} script`);
  if (!containsTest(resolve(directory, 'src'))) failures.push(`${workspace}: missing TypeScript test`);
  failures.push(...validateMetadata(directory, workspace));
  if (existsSync(resolve(directory, 'sample.yml'))) {
    const metadata = JSON.parse(readFileSync(resolve(directory, 'sample.yml'), 'utf8'));
    if (!metadata.sharepoint.writes && /@microsoft\/sp-http|SPHttpClient/.test(readFileSync(packagePath, 'utf8'))) failures.push(`${workspace}: writes:false sample imports SharePoint HTTP`);
  }
}

if (existsSync(resolve(root, 'README.md'))) failures.push(...verifyGeneratedReadme(root, renderMatrix(workspaces.map(workspace => JSON.parse(readFileSync(resolve(root, workspace, 'sample.yml'), 'utf8'))))));
if (!existsSync(resolve(root, 'THIRD_PARTY_NOTICES.md'))) failures.push('missing THIRD_PARTY_NOTICES.md');
else failures.push(...validateNotices(root, workspaces));
if (failures.length) { console.error(failures.join('\n')); process.exitCode = 1; } else console.log(`Coherence OK: ${workspaces.length} workspaces, metadata, README, notices, and write boundaries checked.`);
