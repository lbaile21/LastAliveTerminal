import type { Frame } from '@last-alive/shared';
import type { Interaction } from './interaction';

/**
 * A command never writes to the database. It returns a CommandResult that
 * *describes* what should change; the API applies the mutations atomically and
 * re-validates them against authoritative state.
 */

/** Move the acting player to another node. */
export interface MoveMutation {
  type: 'move';
  playerId: string;
  toNodeId: string;
}

/** Begin a multi-turn interaction (captures the player's subsequent input). */
export interface StartInteractionMutation {
  type: 'startInteraction';
  playerId: string;
  interaction: Interaction;
}

/** End the active interaction. */
export interface EndInteractionMutation {
  type: 'endInteraction';
  playerId: string;
}

/** Increment the failed-attempt counter on the active interaction. */
export interface BumpAttemptsMutation {
  type: 'bumpAttempts';
  playerId: string;
}

/** Record a puzzle as solved, unlocking the node it gates. */
export interface SolvePuzzleMutation {
  type: 'solvePuzzle';
  playerId: string;
  puzzleId: string;
}

/**
 * Infect another player (the bite). Unlike other mutations this targets a
 * player other than the actor — the store applies it to `targetId`, and only
 * if that player is still human.
 */
export interface InfectMutation {
  type: 'infect';
  targetId: string;
  byId: string;
  incubationEndsAt: number;
}

export type StateMutation =
  | MoveMutation
  | StartInteractionMutation
  | EndInteractionMutation
  | BumpAttemptsMutation
  | SolvePuzzleMutation
  | InfectMutation;

/** An append-only record of something that happened, for the `events` log. */
export interface GameEvent {
  type: string;
  actorId?: string;
  targetId?: string;
  payload?: Record<string, unknown>;
}

export interface CommandResult {
  frames: Frame[];
  mutations: StateMutation[];
  events: GameEvent[];
}
