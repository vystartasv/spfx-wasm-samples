import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
export function validateNotices(root, workspaces) {
  const errors = []; const rootNotice = readFileSync(resolve(root, 'THIRD_PARTY_NOTICES.md'), 'utf8');
  for (const workspace of workspaces) {
    const sample = JSON.parse(readFileSync(resolve(root, workspace, 'sample.yml'), 'utf8'));
    const notice = resolve(root, workspace, sample.licensing.notice);
    if (!existsSync(notice)) errors.push(`${workspace}: missing declared notice ${sample.licensing.notice}`);
    for (const dependency of sample.licensing.dependencies) {
      const listed = dependency.name === 'PDFium' ? rootNotice.includes('embedded PDFium in the wrapper') : rootNotice.includes(`${dependency.name}@${dependency.version}`);
      if (!listed || !rootNotice.includes(dependency.license) || !rootNotice.includes(dependency.source)) errors.push(`${workspace}: incomplete root notice for ${dependency.name}@${dependency.version}`);
    }
  }
  return errors;
}

if (process.argv[1]?.endsWith('validate-notices.mjs')) {
  const root = process.cwd();
  const packageJson = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));
  const failures = existsSync(resolve(root, 'THIRD_PARTY_NOTICES.md'))
    ? validateNotices(root, packageJson.workspaces)
    : ['missing THIRD_PARTY_NOTICES.md'];
  if (failures.length) { console.error(failures.join('\n')); process.exitCode = 1; } else console.log('Third-party notices OK.');
}
