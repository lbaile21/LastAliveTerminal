import { describe, it, expect } from 'vitest';
import { advanceVitals, TICK_MS, DECAY_PER_TICK } from '../src/index';

const base = { health: 100, hunger: 100, energy: 100, lastTickAt: 0 };

describe('advanceVitals', () => {
  it('does nothing before a full tick has elapsed', () => {
    expect(advanceVitals(base, TICK_MS - 1)).toEqual(base);
  });

  it('decays hunger and energy by whole ticks', () => {
    const after = advanceVitals(base, TICK_MS * 3);
    expect(after.hunger).toBe(100 - 3 * DECAY_PER_TICK.hunger);
    expect(after.energy).toBe(100 - 3 * DECAY_PER_TICK.energy);
    expect(after.lastTickAt).toBe(TICK_MS * 3);
  });

  it('carries sub-tick remainder in lastTickAt (no lost decay on frequent loads)', () => {
    let state = base;
    // Advance in many small steps that are each shorter than a tick.
    for (let t = TICK_MS / 4; t <= TICK_MS * 4; t += TICK_MS / 4) {
      state = advanceVitals(state, t);
    }
    // Four ticks' worth of decay still landed despite sub-tick polling.
    expect(state.hunger).toBe(100 - 4 * DECAY_PER_TICK.hunger);
  });

  it('clamps vitals at zero', () => {
    const after = advanceVitals(base, TICK_MS * 1000);
    expect(after.hunger).toBe(0);
    expect(after.energy).toBe(0);
  });

  it('erodes health only once the player is already starving', () => {
    const healthy = advanceVitals(base, TICK_MS * 5);
    expect(healthy.health).toBe(100);

    const starving = advanceVitals(
      { health: 100, hunger: 0, energy: 50, lastTickAt: 0 },
      TICK_MS * 2,
    );
    expect(starving.health).toBe(100 - 2 * DECAY_PER_TICK.healthStarving);
  });
});
