import { describe, it, expect } from 'vitest';
import { createRng, randInt, pick } from '../src/index';

const draw = (seed: string, count: number): number[] => {
  const rng = createRng(seed);
  return Array.from({ length: count }, () => rng());
};

describe('seeded rng', () => {
  it('is deterministic — the same seed yields the same sequence', () => {
    expect(draw('S01|tick-7', 5)).toEqual(draw('S01|tick-7', 5));
  });

  it('diverges for different seeds', () => {
    expect(draw('S01|tick-7', 5)).not.toEqual(draw('S01|tick-8', 5));
  });

  it('produces values in [0, 1)', () => {
    for (const v of draw('range-check', 200)) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it('randInt stays within inclusive bounds', () => {
    const rng = createRng('ints');
    for (let i = 0; i < 200; i++) {
      const v = randInt(rng, 3, 9);
      expect(v).toBeGreaterThanOrEqual(3);
      expect(v).toBeLessThanOrEqual(9);
      expect(Number.isInteger(v)).toBe(true);
    }
  });

  it('pick returns a member of the array and throws on empty', () => {
    const rng = createRng('pick');
    const items = ['a', 'b', 'c'] as const;
    expect(items).toContain(pick(rng, items));
    expect(() => pick(rng, [])).toThrow();
  });
});
