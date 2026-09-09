import { chunkIdentity, chunkRanges, createFixture, prepareUpload, simulateResumableTransfer, validateUpload } from './smartUpload';
const testSubtle = { digest: async (): Promise<ArrayBuffer> => new ArrayBuffer(32) } as unknown as SubtleCrypto;

describe('smart upload contracts', () => {
  test('chunk boundaries are deterministic and include a short final chunk', () => {
    expect(chunkRanges(10, 4)).toEqual([{ index: 0, offset: 0, size: 4 }, { index: 1, offset: 4, size: 4 }, { index: 2, offset: 8, size: 2 }]);
  });

  test('hash contract and result parity are stable', async () => {
    const input = { name: 'x.bin', type: 'application/octet-stream', size: 6, data: Uint8Array.from([97, 98, 99, 100, 101, 102]).buffer };
    const result = await prepareUpload(input, 256 * 1024, () => false, testSubtle);
    expect(result.fileHash).toBe('0'.repeat(64));
    expect(result.chunks.map(chunk => chunk.size)).toEqual([6]);
    expect(result.chunks[0].identity).toBe(chunkIdentity(result.fileHash, result.chunks[0]));
  });

  test('cancellation and validation use shaped errors', async () => {
    await expect(prepareUpload({ name: '', type: '', size: 0, data: new ArrayBuffer(0) }, 4)).rejects.toMatchObject({ code: 'INVALID_INPUT' });
    await expect(prepareUpload(createFixture(), 256 * 1024, () => true, testSubtle)).rejects.toMatchObject({ code: 'CANCELLED' });
    expect(validateUpload(undefined, 4)).toContain('Choose one file.');
  });

  test('retry identity is unchanged and simulation returns every chunk', async () => {
    const result = await prepareUpload(createFixture(), 256 * 1024, () => false, testSubtle);
    expect(simulateResumableTransfer(result)).toEqual(result.chunks.map(chunk => chunk.identity));
    expect(simulateResumableTransfer(result)).toEqual(simulateResumableTransfer(result));
  });
});
