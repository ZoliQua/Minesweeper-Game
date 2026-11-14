import { describe, expect, it } from 'vitest';
import { MAX_SCORE, classicScore } from './scoring';

describe('classicScore', () => {
  it('beginner: par 1000, slower scales, floor 100', () => {
    expect(classicScore('beginner', 30)).toBe(1000);
    expect(classicScore('beginner', 5)).toBe(1000);
    expect(classicScore('beginner', 0)).toBe(1000);
    expect(classicScore('beginner', 60)).toBe(500);
    expect(classicScore('beginner', 600)).toBe(100);
    expect(classicScore('beginner', 99999)).toBe(100);
  });
  it('intermediate and expert tables (hex uses the same)', () => {
    expect(classicScore('intermediate', 120)).toBe(3000);
    expect(classicScore('intermediate', 240)).toBe(1500);
    expect(classicScore('expert', 300)).toBe(6000);
    expect(classicScore('expert', 600)).toBe(3000);
    expect(classicScore('expert', 100000)).toBe(600);
  });
  it('classic tops out at 6000; the overall cap (time attack) is 12000', () => {
    expect(MAX_SCORE).toBe(12000);
    expect(classicScore('expert', 1)).toBe(6000);
  });
});
