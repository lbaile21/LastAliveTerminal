import type { NodeType } from '@last-alive/shared';

/**
 * The world is a graph of nodes (locations) joined by edges (mesh links).
 * The graph is static per season — generated ahead of time and frozen — so the
 * engine can hold it entirely in memory and treat it as read-only.
 */

export interface WorldNode {
  /** Stable internal id, e.g. `node-atrium`. Referenced by edges. */
  id: string;
  /** Short display code shown to players, e.g. `ATRIUM`. */
  code: string;
  name: string;
  type: NodeType;
  lore: string;
  /** Optional key into the client ASCII art registry. */
  asciiArtKey?: string;
  /** Optional puzzle gating entry to this node (wired up in M2). */
  puzzleId?: string;
  /** Ids of directly reachable neighbouring nodes. */
  edges: string[];
}

export interface WorldGraph {
  seasonCode: string;
  startNodeId: string;
  nodes: Record<string, WorldNode>;
}

export function getNode(world: WorldGraph, id: string): WorldNode | undefined {
  return world.nodes[id];
}

/** Look a node up by its player-facing code, case-insensitively. */
export function findNodeByCode(world: WorldGraph, code: string): WorldNode | undefined {
  const upper = code.toUpperCase();
  return Object.values(world.nodes).find((n) => n.code.toUpperCase() === upper);
}

export function getAdjacent(world: WorldGraph, id: string): WorldNode[] {
  const node = world.nodes[id];
  if (!node) return [];
  return node.edges
    .map((edgeId) => world.nodes[edgeId])
    .filter((n): n is WorldNode => n !== undefined);
}

export function areAdjacent(world: WorldGraph, fromId: string, toId: string): boolean {
  return world.nodes[fromId]?.edges.includes(toId) ?? false;
}
