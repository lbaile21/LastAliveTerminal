import { describe, it, expect } from 'vitest';
import { getPuzzle, puzzleRegistry, puzzleSeed } from '../src/index';
import { wordFor } from '../src/puzzles/defs/binaryDecode';
import { plainFor, shiftFor } from '../src/puzzles/defs/caesarCipher';

describe('puzzle registry', () => {
  it('registers the classic puzzles by id', () => {
    expect(getPuzzle('binary-keypad')).toBeDefined();
    expect(getPuzzle('caesar-lock')).toBeDefined();
    expect(getPuzzle('nope')).toBeUndefined();
    expect(Object.keys(puzzleRegistry).sort()).toEqual(['binary-keypad', 'caesar-lock']);
  });

  it('builds a stable per-player seed', () => {
    const a = puzzleSeed('player-1', 'binary-keypad', 'S01');
    expect(a).toBe(puzzleSeed('player-1', 'binary-keypad', 'S01'));
    expect(a).not.toBe(puzzleSeed('player-2', 'binary-keypad', 'S01'));
  });
});

describe('binary-keypad puzzle', () => {
  const puzzle = getPuzzle('binary-keypad')!;

  it('renders the access word as space-separated 8-bit binary', () => {
    const seed = puzzleSeed('player-1', 'binary-keypad', 'S01');
    const { prompt } = puzzle.render(seed);
    const word = wordFor(seed);
    const expected = [...word]
      .map((c) => c.charCodeAt(0).toString(2).padStart(8, '0'))
      .join(' ');
    expect(prompt).toContain(expected);
  });

  it('accepts the seed-derived word and rejects others', () => {
    const seed = puzzleSeed('player-1', 'binary-keypad', 'S01');
    expect(puzzle.validate(wordFor(seed), seed)).toBe(true);
    expect(puzzle.validate(`  ${wordFor(seed).toLowerCase()} `, seed)).toBe(true);
    expect(puzzle.validate('WRONGWORD', seed)).toBe(false);
  });

  it('never leaks the plaintext answer in the rendered prompt', () => {
    for (const player of ['player-1', 'player-2', 'player-3', 'player-9', 'zz']) {
      const seed = puzzleSeed(player, 'binary-keypad', 'S01');
      expect(puzzle.render(seed).prompt.toUpperCase()).not.toContain(wordFor(seed));
    }
  });
});

describe('caesar-lock puzzle', () => {
  const puzzle = getPuzzle('caesar-lock')!;

  it('round-trips: the rendered cipher decodes to the seed-derived word', () => {
    const seed = puzzleSeed('player-1', 'caesar-lock', 'S01');
    expect(puzzle.validate(plainFor(seed), seed)).toBe(true);
    expect(shiftFor(seed)).toBeGreaterThanOrEqual(1);
    expect(shiftFor(seed)).toBeLessThanOrEqual(25);
  });
});
