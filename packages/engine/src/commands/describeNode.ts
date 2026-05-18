import type { Frame } from '@last-alive/shared';
import type { GameContext } from '../context';
import type { WorldNode } from '../world/graph';
import { getAdjacent } from '../world/graph';
import { ascii, choice, mapFrame, text } from '../frameBuilders';

/**
 * Render a node the player is standing in: optional art, name + lore, who else
 * is here, a map of the local mesh, and action chips. Shared by `look` and
 * `move` so arriving somewhere reads the same as inspecting it.
 *
 * `solvedPuzzles` is passed explicitly so a caller mid-mutation (e.g. a puzzle
 * just solved) can render the post-solve view before the mutation is applied.
 */
export function describeNode(
  ctx: GameContext,
  node: WorldNode,
  solvedPuzzles: string[] = ctx.player.solvedPuzzles,
): Frame[] {
  const frames: Frame[] = [];
  if (node.asciiArtKey) frames.push(ascii(node.asciiArtKey));
  frames.push(text([`:: ${node.code} — ${node.name}`, '', node.lore], 'system'));

  // Occupants are only meaningful for the node the player is actually in.
  const atCurrentNode = node.id === ctx.player.currentNodeId;
  if (atCurrentNode && ctx.occupants.length > 0) {
    frames.push(
      text(
        ['SURVIVORS HERE:', ...ctx.occupants.map((o) => `  ${o.callsign} — ${o.apparentStatus}`)],
        'system',
      ),
    );
  }

  const adjacent = getAdjacent(ctx.world, node.id);
  frames.push(mapFrame(node.id, [node, ...adjacent], solvedPuzzles));

  const options = adjacent.map((n) => {
    const sealed = n.puzzleId !== undefined && !solvedPuzzles.includes(n.puzzleId);
    return {
      label: sealed ? `move ${n.code} ·sealed·` : `move ${n.code}`,
      command: `move ${n.code}`,
    };
  });

  // A zombie standing here sees its prey as tappable bite targets.
  if (atCurrentNode && ctx.player.status === 'zombie') {
    for (const o of ctx.occupants) {
      if (o.apparentStatus === 'human') {
        options.push({ label: `bite ${o.callsign}`, command: `bite ${o.callsign}` });
      }
    }
  }

  if (options.length > 0) frames.push(choice(options));
  return frames;
}
