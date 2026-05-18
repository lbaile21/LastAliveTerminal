import { createRng, hashSeed, pick } from '../../rng';
import type { PuzzleDef } from '../types';

/** Candidate plaintext words. Exported for tests; never sent to the client. */
export const WORDS = [
  'QUARANTINE',
  'OUTBREAK',
  'ANTIDOTE',
  'LOCKDOWN',
  'PATHOGEN',
  'SURVIVOR',
] as const;

/** The plaintext word for a given seed. */
export function plainFor(seed: string): string {
  return pick(createRng(seed), WORDS);
}

/** The Caesar shift (1–25) for a given seed. */
export function shiftFor(seed: string): number {
  return 1 + (hashSeed(`${seed}|shift`) % 25);
}

function encode(word: string, shift: number): string {
  return [...word]
    .map((ch) => {
      const code = ch.charCodeAt(0) - 65;
      return String.fromCharCode(((code + shift) % 26) + 65);
    })
    .join('');
}

/** Decode a Caesar-shifted access word given the shift. */
export const caesarCipher: PuzzleDef = {
  id: 'caesar-lock',
  kind: 'classic',
  summary: 'Decode a Caesar-shifted access word.',

  render(seed) {
    const shift = shiftFor(seed);
    const cipher = encode(plainFor(seed), shift);
    return {
      prompt: [
        'CIPHER LOCK',
        `intercepted access word, Caesar-shifted by +${shift}:`,
        '',
        `   ${cipher}`,
        '',
        'shift it back and type the plaintext. type `abort` to back away.',
      ].join('\n'),
    };
  },

  validate(answer, seed) {
    return answer.trim().toUpperCase() === plainFor(seed);
  },
};
