import { season01 } from '../src/index';
import type { GameContext, OccupantView, PlayerView, WorldGraph } from '../src/index';

/** Build a player view for tests, overriding only what a case cares about. */
export function makePlayer(overrides: Partial<PlayerView> = {}): PlayerView {
  return {
    id: 'player-1',
    callsign: 'NOMAD',
    status: 'human',
    currentNodeId: season01.startNodeId,
    health: 100,
    hunger: 100,
    energy: 100,
    incubationEndsAt: null,
    solvedPuzzles: [],
    interaction: null,
    ...overrides,
  };
}

interface ContextOverrides {
  player?: Partial<PlayerView>;
  occupants?: OccupantView[];
  world?: WorldGraph;
  now?: number;
}

/** Build a game context for tests. `now` is fixed so results stay stable. */
export function makeContext(overrides: ContextOverrides = {}): GameContext {
  return {
    player: makePlayer(overrides.player),
    occupants: overrides.occupants ?? [],
    world: overrides.world ?? season01,
    now: overrides.now ?? 1_700_000_000_000,
  };
}
