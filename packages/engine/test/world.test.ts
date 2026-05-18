import { describe, it, expect } from 'vitest';
import { season01, getNode, findNodeByCode, getAdjacent, areAdjacent } from '../src/index';

describe('season 01 world graph', () => {
  it('has a start node that exists in the graph', () => {
    expect(getNode(season01, season01.startNodeId)).toBeDefined();
  });

  it('has internally consistent edges (every edge points to a real node)', () => {
    for (const node of Object.values(season01.nodes)) {
      for (const edgeId of node.edges) {
        expect(season01.nodes[edgeId], `${node.id} → ${edgeId}`).toBeDefined();
      }
    }
  });

  it('has symmetric edges (mesh links work both ways)', () => {
    for (const node of Object.values(season01.nodes)) {
      for (const edgeId of node.edges) {
        expect(areAdjacent(season01, edgeId, node.id), `${edgeId} ↔ ${node.id}`).toBe(true);
      }
    }
  });

  it('looks nodes up by code case-insensitively', () => {
    expect(findNodeByCode(season01, 'atrium')?.id).toBe('node-atrium');
    expect(findNodeByCode(season01, 'ATRIUM')?.id).toBe('node-atrium');
    expect(findNodeByCode(season01, 'nope')).toBeUndefined();
  });

  it('returns adjacent nodes for the atrium hub', () => {
    const codes = getAdjacent(season01, 'node-atrium')
      .map((n) => n.code)
      .sort();
    expect(codes).toEqual(['GATE', 'LAB-A', 'SEWER', 'VAULT']);
  });
});
