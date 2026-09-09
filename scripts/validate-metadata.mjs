import { existsSync, readFileSync } from 'node:fs';
import { resolve, basename } from 'node:path';
import schema from '../docs/standards/sample.schema.json' with { type: 'json' };
const isRecord = value => value !== null && typeof value === 'object' && !Array.isArray(value);

function validateSchema(value, definition, path, errors) {
  if (definition.type === 'object') {
    if (!isRecord(value)) { errors.push(`${path}: must be an object`); return; }
    for (const key of definition.required || []) if (!(key in value)) errors.push(`${path}: missing ${key}`);
    if (definition.additionalProperties === false) for (const key of Object.keys(value)) {
      if (!(key in definition.properties)) errors.push(`${path}.${key}: unknown property`);
    }
    for (const [key, child] of Object.entries(definition.properties || {})) if (key in value) validateSchema(value[key], child, `${path}.${key}`, errors);
  } else if (definition.type === 'array') {
    if (!Array.isArray(value)) { errors.push(`${path}: must be an array`); return; }
    if (definition.minItems !== undefined && value.length < definition.minItems) errors.push(`${path}: must contain at least ${definition.minItems} item(s)`);
    if (definition.items) value.forEach((item, index) => validateSchema(item, definition.items, `${path}[${index}]`, errors));
  } else if (definition.type === 'string') {
    if (typeof value !== 'string') errors.push(`${path}: must be a string`);
    else {
      if (definition.minLength !== undefined && value.length < definition.minLength) errors.push(`${path}: must be non-empty`);
      if (definition.format === 'uri') try { new URL(value); } catch { errors.push(`${path}: must be a valid URI`); }
    }
  } else if (definition.type === 'boolean' && typeof value !== 'boolean') errors.push(`${path}: must be a boolean`);
  if (definition.enum && !definition.enum.includes(value)) errors.push(`${path}: invalid value`);
}

export function validateMetadata(directory, workspace) {
  const errors = []; const path = resolve(directory, 'sample.yml'); if (!existsSync(path)) return [`${workspace}: missing sample.yml`];
  let value; try { value = JSON.parse(readFileSync(path, 'utf8')); } catch { return [`${workspace}: sample.yml must be JSON-compatible YAML`]; }
  validateSchema(value, schema, workspace, errors);
  if (isRecord(value) && value.id !== basename(directory)) errors.push(`${workspace}: metadata id must match directory`);
  return errors;
}
if (process.argv[1]?.endsWith('validate-metadata.mjs')) {
  const { readdirSync } = await import('node:fs'); const root = process.cwd(); const failures = [];
  for (const name of readdirSync(resolve(root, 'samples'))) { const directory = resolve(root, 'samples', name); if (existsSync(resolve(directory, 'package.json'))) failures.push(...validateMetadata(directory, `samples/${name}`)); }
  if (failures.length) { console.error(failures.join('\n')); process.exitCode = 1; } else console.log('Metadata OK.');
}
