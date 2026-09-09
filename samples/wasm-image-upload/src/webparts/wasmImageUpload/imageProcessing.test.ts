import {
  calculatePercentageSaved,
  formatBytes,
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
    expect(validateImageFiles([{ name: 'large.jpg', type: 'image/jpeg', size: 20 * 1024 * 1024 + 1 }])).toEqual(['large.jpg is larger than the 20 MB limit.']);
  });

  test('shapes a benchmark result from supplied measurements', () => {
    const result = shapeBenchmarkResult(2000, 1500, 12.5, 'Browser-native worker', [], true);
    expect(result).toMatchObject({
      originalBytes: 2000,
      optimizedBytes: 1500,
      bytesSaved: 500,
      percentageSaved: 25,
      durationMs: 12.5,
      engine: 'Browser-native worker'
    });
  });
});
