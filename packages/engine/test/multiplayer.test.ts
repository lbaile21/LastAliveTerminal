import { describe, it, expect } from 'vitest';
import { runCommand, advancePlayer, INCUBATION_MS, TICK_MS } from '../src/index';
import type { Frame, PlayerStatus } from '@last-alive/shared';
import type { OccupantView, PlayerSimState } from '../src/index';
import { makeContext } from './helpers';

const types = (frames: Frame[]): string[] => frames.map((f) => f.type);

const simState = (over: Partial<PlayerSimState>): PlayerSimState => ({
  status: 'human',
  health: 100,
  hunger: 100,
  energy: 100,
  incubationEndsAt: null,
  lastTickAt: 0,
  ...over,
});

describe('advancePlayer — status transitions', () => {
  it('turns an infected player into a zombie once incubation elapses', () => {
    const after = advancePlayer(simState({ status: 'infected', incubationEndsAt: 1_000 }), 2_000);
    expect(after.status).toBe('zombie');
    expect(after.incubationEndsAt).toBeNull();
  });

  it('leaves an infected player infected before incubation completes', () => {
    const after = advancePlayer(simState({ status: 'infected', incubationEndsAt: 10_000 }), 5_000);
    expect(after.status).toBe('infected');
  });

  it('does not decay a zombie', () => {
    const after = advancePlayer(simState({ status: 'zombie' }), TICK_MS * 10);
    expect(after.hunger).toBe(100);
  });

  it('kills a starving human whose health runs out', () => {
    const after = advancePlayer(
      simState({ status: 'human', hunger: 0, health: 10 }),
      TICK_MS * 5,
    );
    expect(after.status).toBe('dead');
  });
});

const occupant = (callsign: string, apparentStatus: OccupantView['apparentStatus']): OccupantView => ({
  id: `id-${callsign}`,
  callsign,
  apparentStatus,
});

describe('bite', () => {
  const zombieAmong = (occupants: OccupantView[]) =>
    makeContext({ player: { status: 'zombie' as PlayerStatus }, occupants });

  it('emits an infect mutation against a human at the node', () => {
    const result = runCommand(zombieAmong([occupant('EMBER', 'human')]), 'bite EMBER');
    expect(result.mutations).toEqual([
      {
        type: 'infect',
        targetId: 'id-EMBER',
        byId: 'player-1',
        incubationEndsAt: 1_700_000_000_000 + INCUBATION_MS,
      },
    ]);
    expect(result.events[0]).toMatchObject({ type: 'bite', targetId: 'id-EMBER' });
  });

  it('refuses when the actor is not a zombie', () => {
    const result = runCommand(makeContext({ occupants: [occupant('EMBER', 'human')] }), 'bite EMBER');
    expect(result.mutations).toEqual([]);
    expect(result.frames[0]).toMatchObject({ style: 'error' });
  });

  it('refuses to bite someone who is not present', () => {
    const result = runCommand(zombieAmong([occupant('EMBER', 'human')]), 'bite GHOST');
    expect(result.mutations).toEqual([]);
    expect(result.frames[0]).toMatchObject({ style: 'error' });
  });

  it('refuses to bite an existing zombie', () => {
    const result = runCommand(zombieAmong([occupant('HORDE', 'zombie')]), 'bite HORDE');
    expect(result.mutations).toEqual([]);
  });
});

describe('scan & presence', () => {
  it('lists the occupants at the node', () => {
    const result = runCommand(
      makeContext({ occupants: [occupant('EMBER', 'human'), occupant('HORDE', 'zombie')] }),
      'scan',
    );
    const body = (result.frames[0] as { lines: string[] }).lines.join('\n');
    expect(body).toContain('EMBER');
    expect(body).toContain('HORDE');
  });

  it('offers a zombie tappable bite targets via a choice frame', () => {
    const result = runCommand(
      makeContext({ player: { status: 'zombie' as PlayerStatus }, occupants: [occupant('EMBER', 'human')] }),
      'scan',
    );
    expect(types(result.frames)).toContain('choice');
  });

  it('shows occupants in the look output', () => {
    const result = runCommand(makeContext({ occupants: [occupant('EMBER', 'human')] }), 'look');
    const hasOccupantLine = result.frames.some(
      (f) => f.type === 'text' && f.lines.some((l) => l.includes('EMBER')),
    );
    expect(hasOccupantLine).toBe(true);
  });
});
