import type { Frame } from '@last-alive/shared';
import { areAdjacent, findNodeByCode, getNode } from '../world/graph';
import { text } from '../frameBuilders';
import { getPuzzle, puzzleSeed } from '../puzzles/registry';
import { getAiPuzzle } from '../puzzles/aiPuzzles';
import type { CommandHandler } from './handler';
import { describeNode } from './describeNode';
import { fail } from './util';

/** `move <code>` — traverse a mesh link to an adjacent node. */
export const moveCommand: CommandHandler = {
  verb: 'move',
  summary: 'Travel to an adjacent node. Usage: move <code>',
  run: (ctx, cmd) => {
    if (ctx.player.status === 'dead') {
      return fail('You are dead. The mesh shows only static.');
    }
    if (!cmd.target) {
      return fail('move where? name a node code, e.g. `move ATRIUM`.');
    }

    const current = getNode(ctx.world, ctx.player.currentNodeId);
    if (!current) return fail('SIGNAL LOST :: your position is not on the mesh.');

    const dest = findNodeByCode(ctx.world, cmd.target);
    if (!dest) return fail(`unknown node "${cmd.target}". try \`look\` to see your routes.`);
    if (dest.id === current.id) return fail(`you are already at ${dest.code}.`);
    if (!areAdjacent(ctx.world, current.id, dest.id)) {
      return fail(`no mesh link from ${current.code} to ${dest.code}.`);
    }

    // The destination is sealed by an unsolved puzzle — open the interaction
    // instead of moving. The player's next input becomes the answer.
    if (dest.puzzleId && !ctx.player.solvedPuzzles.includes(dest.puzzleId)) {
      // AI-gated node: open a conversation. The AI layer drives it from here.
      const aiPuzzle = getAiPuzzle(dest.puzzleId);
      if (aiPuzzle) {
        const promptFrame: Frame = {
          type: 'prompt',
          puzzleId: dest.puzzleId,
          prompt: 'ANURA is listening. Speak — or type `abort` to step away.',
        };
        return {
          frames: [
            text(`·· ${dest.code} is sealed ··`, 'system'),
            text(aiPuzzle.intro.split('\n'), 'enemy'),
            promptFrame,
          ],
          mutations: [
            {
              type: 'startInteraction',
              playerId: ctx.player.id,
              interaction: {
                kind: 'npc',
                npcId: aiPuzzle.npcId,
                puzzleId: dest.puzzleId,
                nodeId: dest.id,
                transcript: [],
              },
            },
          ],
          events: [
            {
              type: 'npc_conversation_start',
              actorId: ctx.player.id,
              payload: { npcId: aiPuzzle.npcId, puzzleId: dest.puzzleId },
            },
          ],
        };
      }

      const puzzle = getPuzzle(dest.puzzleId);
      if (puzzle) {
        const seed = puzzleSeed(ctx.player.id, dest.puzzleId, ctx.world.seasonCode);
        const rendered = puzzle.render(seed);
        const promptFrame: Frame = {
          type: 'prompt',
          puzzleId: dest.puzzleId,
          prompt: rendered.prompt,
        };
        return {
          frames: [text(`·· ${dest.code} is sealed ··`, 'system'), promptFrame],
          mutations: [
            {
              type: 'startInteraction',
              playerId: ctx.player.id,
              interaction: { kind: 'puzzle', puzzleId: dest.puzzleId, nodeId: dest.id, attempts: 0 },
            },
          ],
          events: [
            { type: 'puzzle_start', actorId: ctx.player.id, payload: { puzzleId: dest.puzzleId } },
          ],
        };
      }
    }

    return {
      frames: [
        text(`·· traversing mesh link → ${dest.code} ··`, 'system'),
        ...describeNode(ctx, dest),
      ],
      mutations: [{ type: 'move', playerId: ctx.player.id, toNodeId: dest.id }],
      events: [
        { type: 'move', actorId: ctx.player.id, payload: { from: current.id, to: dest.id } },
      ],
    };
  },
};
