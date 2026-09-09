import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const rootPackage = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));
const failures = [];
const workspaces = rootPackage.workspaces;
const containsTest = directory => readdirSync(directory, { withFileTypes: true }).some(entry => entry.isDirectory()
  ? containsTest(resolve(directory, entry.name))
  : /\.test\.tsx?$/.test(entry.name));

for (const workspace of workspaces) {
  const directory = resolve(root, workspace);
  const packagePath = resolve(directory, 'package.json');
  if (!existsSync(packagePath)) { failures.push(`${workspace}: missing package.json`); continue; }
  const sample = JSON.parse(readFileSync(packagePath, 'utf8'));
  for (const required of ['README.md', 'src']) if (!existsSync(resolve(directory, required))) failures.push(`${workspace}: missing ${required}`);
  const loc = resolve(directory, 'src/webparts');
  if (!existsSync(loc)) { failures.push(`${workspace}: missing src/webparts`); continue; }
  const localizedWebparts = readdirSync(loc, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name)
    .sort()
    .filter(name => existsSync(resolve(loc, name, 'loc/en-us.js')) && existsSync(resolve(loc, name, 'loc/mystrings.d.ts')));
  if (localizedWebparts.length === 0) failures.push(`${workspace}: missing localization resources (no webpart directory contains both files)`);
  if (localizedWebparts.length > 1) failures.push(`${workspace}: ambiguous localization resources (webparts: ${localizedWebparts.join(', ')})`);
  for (const script of ['test', 'build', 'package-solution']) if (!sample.scripts?.[script]) failures.push(`${workspace}: missing ${script} script`);
  if (!containsTest(resolve(directory, 'src'))) failures.push(`${workspace}: missing TypeScript test`);
}

if (failures.length) { console.error(failures.join('\n')); process.exitCode = 1; } else console.log(`Coherence OK: ${workspaces.length} workspaces checked.`);
