import type { PlayerStatus } from '@last-alive/shared';
import type { WorldGraph } from './world/graph';
import type { Interaction } from './interaction';

/**
 * The immutable snapshot a command reads.
 *
 * The API builds a GameContext from authoritative DB state, hands it to the
 * pure engine, and applies the resulting mutations in a transaction. The engine
 * itself never performs I/O and never mutates the context.
 */

export interface PlayerView {
  id: string;
  callsign: string;
  status: PlayerStatus;
  currentNodeId: string;
  health: number;
  hunger: number;
  energy: number;
  /** Epoch ms at which incubation completes, or null if not infected. */
  incubationEndsAt: number | null;
  /** Ids of puzzles this player has solved (unlocks the nodes they gate). */
  solvedPuzzles: string[];
  /** Active multi-turn interaction, if the player is mid-puzzle/conversation. */
  interaction: Interaction | null;
}

/**
 * Another player visible at the acting player's node.
 *
 * `apparentStatus` is what others see — INFECTED players look HUMAN, which is
 * the engine of the trust-and-betrayal layer. The acting player only ever
 * learns their own true status.
 */
export interface OccupantView {
  id: string;
  callsign: string;
  apparentStatus: 'human' | 'zombie' | 'dead';
}

export interface GameContext {
  player: PlayerView;
  /** Other players currently at the acting player's node. */
  occupants: OccupantView[];
  /** Static, frozen world graph for the active season. */
  world: WorldGraph;
  /** Injected wall-clock time (ms epoch). Never read `Date.now()` in-engine. */
  now: number;
}
