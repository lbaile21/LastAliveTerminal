import type { GameContext, StateMutation } from '@last-alive/engine';
import type { Frame } from '@last-alive/shared';
import { memoryStore } from './memoryStore';
import { supabaseStore } from './supabaseStore';

/**
 * Persistence boundary for the server-authoritative game.
 *
 * The engine is pure; a GameStore is the only thing that touches durable state.
 * Two implementations share this interface: an in-process memory store (zero
 * config, shared across players in one process) and a Supabase-backed store.
 */
export interface GameStore {
  /** Ensure a player and their current-season run exist; return the player id. */
  ensurePlayer(playerId: string | null): Promise<string>;
  /** Build the engine context for a player, or null if they do not exist. */
  loadContext(playerId: string): Promise<GameContext | null>;
  /** Apply engine-produced mutations to durable state. */
  applyMutations(playerId: string, mutations: StateMutation[]): Promise<void>;
  /** What an AI character remembers about a player across conversations. */
  getNpcMemory(playerId: string, npcId: string): Promise<string | null>;
  /** Persist an AI character's memory of a player. */
  setNpcMemory(playerId: string, npcId: string, summary: string): Promise<void>;
  /** Pull and clear pending out-of-band notification frames for a player. */
  drainNotifications(playerId: string): Promise<Frame[]>;
  /** Queue notification frames for a specific set of players. */
  notifyPlayers(playerIds: string[], frames: Frame[]): Promise<void>;
  /** Queue notification frames for every player in the active season. */
  notifyBroadcast(exceptPlayerId: string, frames: Frame[]): Promise<void>;
}

/** The frames a player receives when another player bites them. */
export const BITE_NOTIFICATION: Frame[] = [
  {
    type: 'text',
    style: 'enemy',
    lines: [
      '·· SOMETHING TORE INTO YOU ··',
      'a bite. the wound is already cold.',
      'run `status` — the strain is in your blood now.',
    ],
  },
];

/** True when Supabase credentials are configured. */
export function isSupabaseConfigured(): boolean {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

/** Select the active store: Supabase when configured, otherwise in-memory. */
export function getStore(): GameStore {
  return isSupabaseConfigured() ? supabaseStore : memoryStore;
}
