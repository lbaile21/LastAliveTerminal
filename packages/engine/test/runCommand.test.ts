import { describe, it, expect } from 'vitest';
import { runCommand } from '../src/index';
import type { Frame } from '@last-alive/shared';
import { makeContext } from './helpers';

const types = (frames: Frame[]): string[] => frames.map((f) => f.type);

describe('runCommand — look', () => {
  it('describes the start node with art, lore, a map and movement choices', () => {
    const result = runCommand(makeContext(), 'look');
    expect(types(result.frames)).toEqual(['ascii', 'text', 'map', 'choice']);
    expect(result.mutations).toEqual([]);
    expect(result.events[0]?.type).toBe('look');
  });
});

describe('runCommand — move', () => {
  it('moves to an adjacent node and emits a move mutation', () => {
    const result = runCommand(makeContext(), 'move ATRIUM');
    expect(result.mutations).toEqual([
      { type: 'move', playerId: 'player-1', toNodeId: 'node-atrium' },
    ]);
    expect(result.events[0]).toEqual({
      type: 'move',
      actorId: 'player-1',
      payload: { from: 'node-gate', to: 'node-atrium' },
    });
    expect(types(result.frames)).toContain('map');
  });

  it('is case-insensitive on the node code', () => {
    const result = runCommand(makeContext(), 'move atrium');
    expect(result.mutations).toEqual([
      { type: 'move', playerId: 'player-1', toNodeId: 'node-atrium' },
    ]);
  });

  it('refuses to move to a non-adjacent node', () => {
    const result = runCommand(makeContext(), 'move VAULT');
    expect(result.mutations).toEqual([]);
    expect(types(result.frames)).toEqual(['text']);
    expect(result.frames[0]).toMatchObject({ type: 'text', style: 'error' });
  });

  it('refuses an unknown node code', () => {
    const result = runCommand(makeContext(), 'move NOWHERE');
    expect(result.mutations).toEqual([]);
    expect(result.frames[0]).toMatchObject({ style: 'error' });
  });

  it('refuses to move with no target', () => {
    const result = runCommand(makeContext(), 'move');
    expect(result.mutations).toEqual([]);
    expect(result.frames[0]).toMatchObject({ style: 'error' });
  });

  it('refuses to move when the player is dead', () => {
    const ctx = makeContext({ player: { status: 'dead' } as never });
    const result = runCommand(ctx, 'move ATRIUM');
    expect(result.mutations).toEqual([]);
    expect(result.frames[0]).toMatchObject({ style: 'error' });
  });
});

describe('runCommand — status & help', () => {
  it('reports a status frame carrying the player vitals', () => {
    const result = runCommand(makeContext(), 'status');
    expect(result.frames[0]).toMatchObject({
      type: 'status',
      status: 'human',
      vitals: { health: 100, hunger: 100, energy: 100 },
    });
  });

  it('help lists every registered verb', () => {
    const result = runCommand(makeContext(), 'help');
    const body = (result.frames[0] as { lines: string[] }).lines.join('\n');
    for (const verb of ['look', 'move', 'status', 'help']) {
      expect(body).toContain(verb);
    }
  });
});

describe('runCommand — unrecognized input', () => {
  it('rejects an unknown verb with an error frame', () => {
    const result = runCommand(makeContext(), 'sudo rm -rf');
    expect(result.frames[0]).toMatchObject({ type: 'text', style: 'error' });
  });

  it('prompts for input on a blank command', () => {
    const result = runCommand(makeContext(), '   ');
    expect(result.frames[0]).toMatchObject({ type: 'text', style: 'system' });
  });
});

describe('runCommand — purity & determinism', () => {
  it('produces identical results for identical inputs', () => {
    expect(runCommand(makeContext(), 'move ATRIUM')).toEqual(
      runCommand(makeContext(), 'move ATRIUM'),
    );
  });

  it('does not mutate the context it is given', () => {
    const ctx = makeContext();
    const snapshot = structuredClone(ctx);
    runCommand(ctx, 'move ATRIUM');
    expect(ctx).toEqual(snapshot);
  });
});
