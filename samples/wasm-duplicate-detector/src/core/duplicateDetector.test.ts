import { duplicateBytes, generateFixture, groupHashes, shapeResult, validateInputs } from './duplicateDetector';

describe('duplicate detector core', () => {
  test('groups hashes deterministically and counts bytes beyond first copy', () => {
    const groups = groupHashes([{ name: 'b', size: 4, type: '', hash: 'bb' }, { name: 'a', size: 4, type: '', hash: 'aa' }, { name: 'c', size: 4, type: '', hash: 'bb' }, { name: 'd', size: 9, type: '', hash: 'bb' }, { name: 'e', size: 4, type: '', hash: 'aa' }]);
    expect(groups.map(group => group.hash)).toEqual(['aa', 'bb']);
    expect(duplicateBytes(groups)).toBe(17);
    expect(shapeResult(groups[0].files.map(file => ({ ...file, hash: 'aa' })), 2, 'Browser Web Crypto SHA-256')).toMatchObject({ durationMs: 2, bytesScanned: 8, duplicateBytes: 4 });
  });
  test('fixture is lazy, deterministic, and repetitive', () => { const first = generateFixture(10000); const second = generateFixture(10000); expect(first).toHaveLength(10000); expect(new Uint8Array(first[0].data)).toEqual(new Uint8Array(second[0].data)); expect(new Uint8Array(first[0].data)).toEqual(new Uint8Array(first[250].data)); });
  test('validates bounds', () => { expect(validateInputs([])).toEqual(['Select at least one file.']); expect(validateInputs([{ name: 'x', size: 50 * 1024 * 1024 + 1 }])[0]).toContain('larger'); });
});
