import { describe, it, expect } from 'vitest';
import { runCommand } from '../src/index';
import type { Frame } from '@last-alive/shared';
import { makeContext } from './helpers';

const types = (frames: Frame[]): string[] => frames.map((f) => f.type);

describe('AI-gated node (VAULT / ANURA)', () => {
  it('opens an NPC conversation when moving to an AI-gated node', () => {
    const ctx = makeContext({ player: { currentNodeId: 'node-atrium' } });
    const result = runCommand(ctx, 'move VAULT');

    expect(types(result.frames)).toContain('prompt');
    expect(result.mutations).toEqual([
      {
        type: 'startInteraction',
        playerId: 'player-1',
        interaction: {
          kind: 'npc',
          npcId: 'anura',
          puzzleId: 'anura-vault',
          nodeId: 'node-vault',
          transcript: [],
        },
      },
    ]);
  });

  it('moves straight through once ANURA has granted access', () => {
    const ctx = makeContext({
      player: { currentNodeId: 'node-atrium', solvedPuzzles: ['anura-vault'] },
    });
    const result = runCommand(ctx, 'move VAULT');
    expect(result.mutations).toEqual([
      { type: 'move', playerId: 'player-1', toNodeId: 'node-vault' },
    ]);
  });

  it('does not run the engine while an NPC conversation is active', () => {
    const ctx = makeContext({
      player: {
        currentNodeId: 'node-atrium',
        interaction: {
          kind: 'npc',
          npcId: 'anura',
          puzzleId: 'anura-vault',
          nodeId: 'node-vault',
          transcript: [],
        },
      },
    });
    // `look` would normally run; mid-conversation the engine must not act on it.
    const result = runCommand(ctx, 'look');
    expect(result.mutations).toEqual([]);
    expect(types(result.frames)).toEqual(['text']);
  });
});
