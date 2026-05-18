import type { Frame, TextStyle } from '@last-alive/shared';
import type { WorldNode } from './world/graph';

/** Small constructors for the frames the engine emits — keeps commands terse. */

export function text(lines: string | string[], style: TextStyle = 'normal'): Frame {
  return { type: 'text', lines: Array.isArray(lines) ? lines : [lines], style };
}

export function ascii(artKey: string): Frame {
  return { type: 'ascii', artKey };
}

export function mapFrame(
  currentId: string,
  nodes: WorldNode[],
  solvedPuzzles: string[],
): Frame {
  return {
    type: 'map',
    current: currentId,
    nodes: nodes.map((n) => ({
      id: n.id,
      code: n.code,
      name: n.name,
      // A node is locked when it has a puzzle the player has not yet solved.
      locked: n.puzzleId !== undefined && !solvedPuzzles.includes(n.puzzleId),
    })),
  };
}

export function choice(options: Array<{ label: string; command: string }>): Frame {
  return { type: 'choice', options };
}
