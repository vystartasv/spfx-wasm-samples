import type { CacheItem } from './types';
export const FIXTURE: readonly CacheItem[] = [
  { id: 'item-001', title: 'Alpha planning', category: 'Blue', amount: 120, updatedAt: 1 },
  { id: 'item-002', title: 'Bravo launch', category: 'Green', amount: 450, updatedAt: 1 },
  { id: 'item-003', title: 'Charlie review', category: 'Red', amount: 80, updatedAt: 1 },
  { id: 'item-004', title: 'Delta support', category: 'Blue', amount: 240, updatedAt: 1 },
  { id: 'item-005', title: 'Echo renewal', category: 'Green', amount: 310, updatedAt: 1 }
];
export function fixture(): CacheItem[] { return FIXTURE.map(item => ({ ...item })); }
