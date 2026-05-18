import type { ConversationTurn } from '@last-alive/shared';

/**
 * Interactions — multi-turn engagements that capture the player's input.
 *
 * While an interaction is active, raw input is routed to its resolver rather
 * than the command registry: typing IS answering the puzzle, or speaking to an
 * AI character. `abort` always escapes.
 *
 * Puzzle interactions are resolved by the pure engine. NPC interactions require
 * an AI call, so they are resolved one layer up (the API/game service) — the
 * engine only opens and recognises them, never performs the I/O.
 */

export interface PuzzleInteraction {
  kind: 'puzzle';
  puzzleId: string;
  /** The node this puzzle gates entry to. */
  nodeId: string;
  /** Failed attempts so far — drives anti-brute-force later. */
  attempts: number;
}

export interface NpcInteraction {
  kind: 'npc';
  /** The AI character being spoken to. */
  npcId: string;
  /** The AI-puzzle id; clearing it unlocks the gated node. */
  puzzleId: string;
  /** The node this conversation gates entry to. */
  nodeId: string;
  /** The conversation so far. */
  transcript: ConversationTurn[];
}

export type Interaction = PuzzleInteraction | NpcInteraction;
