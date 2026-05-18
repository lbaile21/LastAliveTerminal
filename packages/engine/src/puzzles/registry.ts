import type { PuzzleDef } from './types';
import { binaryDecode } from './defs/binaryDecode';
import { caesarCipher } from './defs/caesarCipher';

/** Every classic puzzle, by id. The single source of truth for puzzle logic. */
const defs: PuzzleDef[] = [binaryDecode, caesarCipher];

export const puzzleRegistry: Record<string, PuzzleDef> = Object.fromEntries(
  defs.map((def) => [def.id, def]),
);

export function getPuzzle(id: string): PuzzleDef | undefined {
  return puzzleRegistry[id];
}

/**
 * Build the per-player seed for a puzzle instance.
 *
 * Combining season + puzzle + player means each player faces a distinct answer,
 * so a solution shared between players is worthless.
 */
export function puzzleSeed(playerId: string, puzzleId: string, seasonCode: string): string {
  return `${seasonCode}|${puzzleId}|${playerId}`;
}
