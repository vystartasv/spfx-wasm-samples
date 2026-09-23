import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const publishedSpfxVersion = '1.23.2';
const targetSpfxVersion = '1.24.0';
const isSpfxPackage = name => /^@microsoft\/(?:sp(?:-|$)|spfx-|eslint-(?:config|plugin)-spfx$)/.test(name);

export function validateCompatibility(root) {
  const rootPackage = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));
  const failures = [];
  const versions = new Set();

  for (const workspace of rootPackage.workspaces) {
    const packagePath = resolve(root, workspace, 'package.json');
    if (!existsSync(packagePath)) continue;
    const sample = JSON.parse(readFileSync(packagePath, 'utf8'));
    for (const [name, version] of Object.entries({ ...sample.dependencies, ...sample.devDependencies })) {
      if (!isSpfxPackage(name)) continue;
      versions.add(version);
      if (version !== publishedSpfxVersion) failures.push(`${workspace}: ${name} must stay on published SPFx ${publishedSpfxVersion}, found ${version}`);
    }
  }

  if (versions.size !== 1 || !versions.has(publishedSpfxVersion)) failures.push(`sample SPFx packages are not aligned to ${publishedSpfxVersion}`);

  const site = resolve(root, 'docs/site/index.html');
  if (existsSync(site)) {
    const siteCopy = readFileSync(site, 'utf8');
    for (const marker of [`SPFx ${targetSpfxVersion} target`, `published stable packages remain ${publishedSpfxVersion}`, 'no tenant evidence claimed']) {
      if (!siteCopy.includes(marker)) failures.push(`docs/site/index.html: missing compatibility marker ${marker}`);
    }
  }

  const research = resolve(root, 'docs/research-current-state.md');
  if (existsSync(research)) {
    const researchCopy = readFileSync(research, 'utf8');
    for (const marker of [`SPFx ${targetSpfxVersion}`, `latest stable package is ${publishedSpfxVersion}`]) {
      if (!researchCopy.includes(marker)) failures.push(`docs/research-current-state.md: missing compatibility marker ${marker}`);
    }
  }

  return failures;
}

if (process.argv[1]?.endsWith('validate-compatibility.mjs')) {
  const failures = validateCompatibility(process.cwd());
  if (failures.length) { console.error(failures.join('\n')); process.exitCode = 1; } else console.log(`Compatibility OK: samples aligned to published SPFx ${publishedSpfxVersion}; target copy is SPFx ${targetSpfxVersion}.`);
}
