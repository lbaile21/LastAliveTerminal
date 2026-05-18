import { createRng, pick } from '../../rng';
import type { PuzzleDef } from '../types';

/** Candidate access words. Exported for tests; never sent to the client. */
export const WORDS = [
  'ACCESS',
  'MARROW',
  'SPECIMEN',
  'BIOHAZARD',
  'CONTAIN',
  'PROTOCOL',
  'NECROSIS',
  'VECTOR',
] as const;

/** The access word for a given seed — deterministic per player + puzzle. */
export function wordFor(seed: string): string {
  return pick(createRng(seed), WORDS);
}

/** Decode an access word transmitted as space-separated 8-bit binary. */
export const binaryDecode: PuzzleDef = {
  id: 'binary-keypad',
  kind: 'classic',
  summary: 'Decode an access word from binary.',

  render(seed) {
    const word = wordFor(seed);
    const binary = [...word]
      .map((ch) => ch.charCodeAt(0).toString(2).padStart(8, '0'))
      .join(' ');
    return {
      prompt: [
        'KEYPAD LOCK :: LAB-A',
        'the door panel wants one keyword, transmitted in binary:',
        '',
        binary,
        '',
        'decode it and type the keyword to unlock. type `abort` to back away.',
      ].join('\n'),
    };
  },

  validate(answer, seed) {
    return answer.trim().toUpperCase() === wordFor(seed);
  },
};
