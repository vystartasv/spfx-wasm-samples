import {
  calculatePercentageSaved,
  formatBytes,
  selectImageEngine,
  shapeBenchmarkResult,
  validateImageFiles
} from './imageProcessing';

describe('image processing helpers', () => {
  test('formats bytes deterministically', () => {
    expect(formatBytes(0)).toBe('0 B');
    expect(formatBytes(1024)).toBe('1 KB');
    expect(formatBytes(1536)).toBe('1.5 KB');
    expect(formatBytes(1024 * 1024)).toBe('1 MB');
  });

  test('calculates percentage saved from measured bytes', () => {
    expect(calculatePercentageSaved(1000, 750)).toBe(25);
    expect(calculatePercentageSaved(0, 0)).toBe(0);
    expect(calculatePercentageSaved(100, 125)).toBe(-25);
  });

  test('validates image type, count, and size', () => {
    expect(validateImageFiles([{ name: 'a.jpg', type: 'image/jpeg', size: 10 }])).toEqual([]);
    expect(validateImageFiles([{ name: 'notes.txt', type: 'text/plain', size: 10 }])).toEqual(['notes.txt is not an image file.']);
    expect(validateImageFiles([{ name: 'large.jpg', type: 'image/jpeg', size: 20 * 1024 * 1024 + 1 }])).toEqual(['Selected images exceed the 20 MB total limit.', 'large.jpg is larger than the 20 MB limit.']);
    expect(validateImageFiles([{ name: 'a.jpg', type: 'image/jpeg', size: 12 * 1024 * 1024 }, { name: 'b.jpg', type: 'image/jpeg', size: 9 * 1024 * 1024 }])).toContain('Selected images exceed the 20 MB total limit.');
  });

  test('shapes a benchmark result from supplied measurements', () => {
    const result = shapeBenchmarkResult(2000, 1500, 12.5, 'Browser-native', [], true);
    expect(result).toMatchObject({
      originalBytes: 2000,
      optimizedBytes: 1500,
      bytesSaved: 500,
      percentageSaved: 25,
      durationMs: 12.5,
      engine: 'Browser-native'
    });
  });

  test('selects WASM only when its lazy worker is available', () => {
    expect(selectImageEngine(true)).toEqual({ engine: 'WASM', warnings: [] });
    expect(selectImageEngine(false, 'WASM worker failed; used browser-native encoding.')).toEqual({
      engine: 'Browser-native',
      warnings: ['WASM worker failed; used browser-native encoding.']
    });
  });
});
