/**
 * Core game enums shared across the engine, API, and client.
 * Kept as `as const` tuples so they double as Zod enum sources and TS unions.
 */

export const PLAYER_STATUSES = ['human', 'infected', 'zombie', 'dead'] as const;
export type PlayerStatus = (typeof PLAYER_STATUSES)[number];

export const NODE_TYPES = [
  'gate',
  'atrium',
  'lab',
  'vault',
  'sewer',
  'street',
  'safehouse',
  'comms',
] as const;
export type NodeType = (typeof NODE_TYPES)[number];

/** Starting / maximum value for each vital. */
export const MAX_VITAL = 100;

/** One turn of an AI-character conversation. Shared by the engine and the AI package. */
export interface ConversationTurn {
  role: 'player' | 'npc';
  text: string;
}
