import { getNode } from '../world/graph';
import type { CommandHandler } from './handler';
import { describeNode } from './describeNode';
import { fail } from './util';

/** `look` — survey the current node. */
export const lookCommand: CommandHandler = {
  verb: 'look',
  summary: 'Survey your surroundings.',
  run: (ctx) => {
    const node = getNode(ctx.world, ctx.player.currentNodeId);
    if (!node) return fail('SIGNAL LOST :: your position is not on the mesh.');

    return {
      frames: describeNode(ctx, node),
      mutations: [],
      events: [{ type: 'look', actorId: ctx.player.id, payload: { nodeId: node.id } }],
    };
  },
};
