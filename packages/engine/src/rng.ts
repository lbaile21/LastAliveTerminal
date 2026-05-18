/**
 * Seeded, deterministic RNG.
 *
 * The engine must never call `Math.random()` — every random draw flows through
 * here with an explicit seed, so the world tick and any simulation step are
 * fully replayable: same seed in, same outcome out. This is what makes the
 * persistent async world testable and auditable.
 */

export type Rng = () => number;

/** mulberry32 — small, fast, good-enough PRNG. Returns floats in [0, 1). */
export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** FNV-1a hash — turns a seed string into a 32-bit unsigned integer. */
export function hashSeed(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Build an RNG from any combination of string/number seed parts. */
export function createRng(...parts: Array<string | number>): Rng {
  return mulberry32(hashSeed(parts.join('|')));
}

/** Integer in [min, max] inclusive. */
export function randInt(rng: Rng, min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1));
}

/** Pick one element from a non-empty array. */
export function pick<T>(rng: Rng, items: readonly T[]): T {
  if (items.length === 0) throw new Error('pick() called on an empty array');
  return items[Math.floor(rng() * items.length)] as T;
}
