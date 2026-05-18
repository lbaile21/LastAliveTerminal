import { parseCommand } from './commandParser';
import { commandRegistry } from './commands';
import { resolveInteraction } from './interactionResolver';
import { text } from './frameBuilders';
import type { GameContext } from './context';
import type { CommandResult } from './types';

/**
 * The engine entry point.
 *
 * `runCommand` is a pure function: given an immutable context and a raw input
 * string, it returns the frames to render and the mutations/events to persist.
 * It performs no I/O and reads no ambient state — the same inputs always
 * produce the same result, which is what makes the game testable end to end.
 *
 * When the player is mid-interaction (a puzzle, or an AI conversation from M2b)
 * input is routed to the interaction resolver instead of the command registry.
 */
export function runCommand(ctx: GameContext, input: string): CommandResult {
  if (ctx.player.interaction) {
    if (ctx.player.interaction.kind === 'npc') {
      // NPC conversations are driven by the AI layer; the engine should not be
      // called for them. Defensive: never silently treat speech as a command.
      return {
        frames: [text('·· transmission open — your words route to the other party ··', 'system')],
        mutations: [],
        events: [],
      };
    }
    return resolveInteraction(ctx, input);
  }

  const cmd = parseCommand(input);

  if (cmd.verb === '') {
    return {
      frames: [text('awaiting input — type `help`.', 'system')],
      mutations: [],
      events: [],
    };
  }

  const handler = commandRegistry[cmd.verb];
  if (!handler) {
    return {
      frames: [
        text(`unrecognized command: "${cmd.verb}". type \`help\` for the manifest.`, 'error'),
      ],
      mutations: [],
      events: [],
    };
  }

  return handler.run(ctx, cmd);
}

export { parseCommand } from './commandParser';
export type { Command } from './commandParser';
export { commandRegistry } from './commands';
export type { CommandHandler } from './commands';
export { resolveInteraction } from './interactionResolver';
export type { GameContext, PlayerView, OccupantView } from './context';
export type { Interaction, PuzzleInteraction, NpcInteraction } from './interaction';
export type {
  CommandResult,
  GameEvent,
  StateMutation,
  MoveMutation,
  StartInteractionMutation,
  EndInteractionMutation,
  BumpAttemptsMutation,
  SolvePuzzleMutation,
  InfectMutation,
} from './types';
export * from './world/graph';
export { season01 } from './world/seed/season-01';
export * from './rng';
export type { PuzzleDef, PuzzleRender } from './puzzles/types';
export { getPuzzle, puzzleRegistry, puzzleSeed } from './puzzles/registry';
export { getAiPuzzle, aiPuzzleRegistry } from './puzzles/aiPuzzles';
export type { AiPuzzleDef } from './puzzles/aiPuzzles';
export { advanceVitals, advancePlayer, TICK_MS, DECAY_PER_TICK, INCUBATION_MS } from './simulation/tick';
export type { VitalsState, PlayerSimState } from './simulation/tick';
