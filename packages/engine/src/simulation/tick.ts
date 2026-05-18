import type { PlayerStatus } from '@last-alive/shared';

/**
 * Player simulation — vitals decay and status transitions.
 *
 * Advancement is computed lazily: rather than a background job touching every
 * player, `advancePlayer` runs when a player's state is loaded, catching them up
 * to the present. Leftover time under one tick is carried in `lastTickAt`, so
 * frequent check-ins never lose or double-count decay.
 */

/** One simulation tick. */
export const TICK_MS = 60_000;

/** How long an infected player incubates before turning into a zombie. */
export const INCUBATION_MS = 3 * 60_000;

/** Vital loss applied per elapsed tick. */
export const DECAY_PER_TICK = {
  hunger: 3,
  energy: 2,
  /** Health loss per tick while hunger is already exhausted. */
  healthStarving: 5,
};

export interface VitalsState {
  health: number;
  hunger: number;
  energy: number;
  /** Epoch ms of the last tick boundary the state was advanced to. */
  lastTickAt: number;
}

export interface PlayerSimState extends VitalsState {
  status: PlayerStatus;
  /** Epoch ms at which incubation completes, or null if not infected. */
  incubationEndsAt: number | null;
}

function clamp(value: number): number {
  return Math.max(0, Math.min(100, value));
}

/** Advance vitals to `now`, returning the caught-up state. Pure. */
export function advanceVitals(state: VitalsState, now: number): VitalsState {
  const ticks = Math.floor((now - state.lastTickAt) / TICK_MS);
  if (ticks <= 0) {
    return { ...state };
  }

  const hunger = clamp(state.hunger - ticks * DECAY_PER_TICK.hunger);
  const energy = clamp(state.energy - ticks * DECAY_PER_TICK.energy);

  // Health only erodes once the player was already starving going in.
  const health =
    state.hunger <= 0 ? clamp(state.health - ticks * DECAY_PER_TICK.healthStarving) : state.health;

  return {
    health,
    hunger,
    energy,
    lastTickAt: state.lastTickAt + ticks * TICK_MS,
  };
}

/**
 * Advance a player to `now`: incubation → zombie, vitals decay, and death.
 *
 * - An infected player whose incubation has elapsed turns into a zombie.
 * - Humans and the infected lose vitals over time; zombies and the dead do not.
 * - A living player whose health hits zero dies.
 */
export function advancePlayer(state: PlayerSimState, now: number): PlayerSimState {
  let status = state.status;
  let incubationEndsAt = state.incubationEndsAt;

  // Incubation completes — the strain wins.
  if (status === 'infected' && incubationEndsAt !== null && now >= incubationEndsAt) {
    status = 'zombie';
    incubationEndsAt = null;
  }

  // Zombies and the dead are past caring about food and sleep.
  const decays = status === 'human' || status === 'infected';
  const vitals = decays
    ? advanceVitals(state, now)
    : { health: state.health, hunger: state.hunger, energy: state.energy, lastTickAt: now };

  // A living survivor whose health is gone flatlines.
  if ((status === 'human' || status === 'infected') && vitals.health <= 0) {
    status = 'dead';
    incubationEndsAt = null;
  }

  return {
    status,
    incubationEndsAt,
    health: vitals.health,
    hunger: vitals.hunger,
    energy: vitals.energy,
    lastTickAt: vitals.lastTickAt,
  };
}
