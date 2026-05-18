import type { Frame } from '@last-alive/shared';
import type { GameContext } from './context';
import type { CommandResult } from './types';
import { getNode } from './world/graph';
import { getPuzzle, puzzleSeed } from './puzzles/registry';
import { describeNode } from './commands/describeNode';
import { text } from './frameBuilders';

const ABORT_WORDS = new Set(['abort', 'leave', 'cancel', 'quit']);

/**
 * Resolve raw input while an interaction is active.
 *
 * `runCommand` routes here whenever `player.interaction` is set, so the player's
 * input is treated as a puzzle answer rather than a command — except `abort`,
 * which always escapes.
 */
export function resolveInteraction(ctx: GameContext, input: string): CommandResult {
  const interaction = ctx.player.interaction;
  if (!interaction) {
    // Defensive — runCommand only routes here when an interaction exists.
    return { frames: [], mutations: [], events: [] };
  }
  if (interaction.kind !== 'puzzle') {
    // NPC interactions need an AI call; they are resolved one layer up.
    return { frames: [], mutations: [], events: [] };
  }

  const trimmed = input.trim();

  if (ABORT_WORDS.has(trimmed.toLowerCase())) {
    return {
      frames: [text('·· you step back from the lock ··', 'system')],
      mutations: [{ type: 'endInteraction', playerId: ctx.player.id }],
      events: [{ type: 'puzzle_abort', actorId: ctx.player.id }],
    };
  }

  const puzzle = getPuzzle(interaction.puzzleId);
  const node = getNode(ctx.world, interaction.nodeId);
  if (!puzzle || !node) {
    return {
      frames: [text('·· the lock short-circuits — interaction reset ··', 'error')],
      mutations: [{ type: 'endInteraction', playerId: ctx.player.id }],
      events: [],
    };
  }

  const seed = puzzleSeed(ctx.player.id, interaction.puzzleId, ctx.world.seasonCode);

  // An empty submission just re-shows the prompt — it is not a failed attempt.
  if (trimmed === '') {
    const rendered = puzzle.render(seed);
    return {
      frames: [{ type: 'prompt', puzzleId: interaction.puzzleId, prompt: rendered.prompt }],
      mutations: [],
      events: [],
    };
  }

  if (puzzle.validate(input, seed)) {
    const solved = [...ctx.player.solvedPuzzles, interaction.puzzleId];
    return {
      frames: [
        text(`ACCESS GRANTED — ${node.code} unlocked.`, 'success'),
        text(`·· traversing mesh link → ${node.code} ··`, 'system'),
        ...describeNode(ctx, node, solved),
      ],
      mutations: [
        { type: 'solvePuzzle', playerId: ctx.player.id, puzzleId: interaction.puzzleId },
        { type: 'endInteraction', playerId: ctx.player.id },
        { type: 'move', playerId: ctx.player.id, toNodeId: node.id },
      ],
      events: [
        {
          type: 'puzzle_solved',
          actorId: ctx.player.id,
          payload: { puzzleId: interaction.puzzleId, attempts: interaction.attempts },
        },
      ],
    };
  }

  const rendered = puzzle.render(seed);
  const promptFrame: Frame = {
    type: 'prompt',
    puzzleId: interaction.puzzleId,
    prompt: rendered.prompt,
  };
  return {
    frames: [
      text(`ACCESS DENIED — incorrect (attempt ${interaction.attempts + 1}).`, 'error'),
      promptFrame,
    ],
    mutations: [{ type: 'bumpAttempts', playerId: ctx.player.id }],
    events: [
      { type: 'puzzle_fail', actorId: ctx.player.id, payload: { puzzleId: interaction.puzzleId } },
    ],
  };
}
