import { randomUUID } from 'node:crypto';
import { advancePlayer, season01 } from '@last-alive/engine';
import type { GameContext, Interaction, OccupantView, StateMutation } from '@last-alive/engine';
import type { Frame, PlayerStatus } from '@last-alive/shared';
import { MAX_VITAL } from '@last-alive/shared';
import type { GameStore } from './store';
import { BITE_NOTIFICATION } from './store';
import { generateCallsign } from './callsign';

/**
 * In-process game store.
 *
 * State lives in module-level Maps — durable for the lifetime of the server
 * process and SHARED across all players, which is what makes local multiplayer
 * testing work. Real persistence and cross-instance sharing need the Supabase
 * store.
 */

interface PlayerRecord {
  id: string;
  callsign: string;
  status: PlayerStatus;
  currentNodeId: string;
  health: number;
  hunger: number;
  energy: number;
  incubationEndsAt: number | null;
  solvedPuzzles: string[];
  interaction: Interaction | null;
  /** Epoch ms of the last vitals/status tick boundary. */
  lastTickAt: number;
}

// Anchored on globalThis so the store survives Next's dev-mode module
// re-evaluation (HMR) — without this, every request would see empty Maps.
const globalForStore = globalThis as typeof globalThis & {
  __laPlayers?: Map<string, PlayerRecord>;
  __laNpcMemory?: Map<string, string>;
  __laNotifications?: Map<string, Frame[]>;
};
const players: Map<string, PlayerRecord> = (globalForStore.__laPlayers ??= new Map());
const npcMemory: Map<string, string> = (globalForStore.__laNpcMemory ??= new Map());
const notifications: Map<string, Frame[]> = (globalForStore.__laNotifications ??= new Map());

const npcMemoryKey = (playerId: string, npcId: string): string => `${playerId}:${npcId}`;

function createRecord(id: string): PlayerRecord {
  return {
    id,
    callsign: generateCallsign(id),
    status: 'human',
    currentNodeId: season01.startNodeId,
    health: MAX_VITAL,
    hunger: MAX_VITAL,
    energy: MAX_VITAL,
    incubationEndsAt: null,
    solvedPuzzles: [],
    interaction: null,
    lastTickAt: Date.now(),
  };
}

/** Catch a record's vitals and status up to `now`, in place. */
function advanceRecord(record: PlayerRecord, now: number): void {
  const advanced = advancePlayer(
    {
      status: record.status,
      health: record.health,
      hunger: record.hunger,
      energy: record.energy,
      incubationEndsAt: record.incubationEndsAt,
      lastTickAt: record.lastTickAt,
    },
    now,
  );
  record.status = advanced.status;
  record.health = advanced.health;
  record.hunger = advanced.hunger;
  record.energy = advanced.energy;
  record.incubationEndsAt = advanced.incubationEndsAt;
  record.lastTickAt = advanced.lastTickAt;
}

/** How a record's status appears to OTHER players — infected looks human. */
function apparentStatus(status: PlayerStatus): OccupantView['apparentStatus'] {
  return status === 'zombie' ? 'zombie' : status === 'dead' ? 'dead' : 'human';
}

function queueNotification(playerId: string, frames: Frame[]): void {
  const queue = notifications.get(playerId) ?? [];
  queue.push(...frames);
  notifications.set(playerId, queue);
}

export const memoryStore: GameStore = {
  async ensurePlayer(playerId) {
    const id = playerId ?? randomUUID();
    if (!players.has(id)) {
      players.set(id, createRecord(id));
    }
    return id;
  },

  async loadContext(playerId): Promise<GameContext | null> {
    const record = players.get(playerId);
    if (!record) return null;

    const now = Date.now();
    advanceRecord(record, now);

    // Build the occupant list, catching each visible player up first so their
    // status (e.g. an incubation that just completed) is current.
    const occupants: OccupantView[] = [];
    for (const other of players.values()) {
      if (other.id === playerId) continue;
      advanceRecord(other, now);
      if (other.currentNodeId !== record.currentNodeId) continue;
      occupants.push({
        id: other.id,
        callsign: other.callsign,
        apparentStatus: apparentStatus(other.status),
      });
    }

    return {
      player: {
        id: record.id,
        callsign: record.callsign,
        status: record.status,
        currentNodeId: record.currentNodeId,
        health: record.health,
        hunger: record.hunger,
        energy: record.energy,
        incubationEndsAt: record.incubationEndsAt,
        solvedPuzzles: [...record.solvedPuzzles],
        interaction: record.interaction,
      },
      occupants,
      world: season01,
      now,
    };
  },

  async applyMutations(playerId, mutations: StateMutation[]) {
    const record = players.get(playerId);
    if (!record) return;
    for (const mutation of mutations) {
      switch (mutation.type) {
        case 'move':
          record.currentNodeId = mutation.toNodeId;
          break;
        case 'startInteraction':
          record.interaction = mutation.interaction;
          break;
        case 'endInteraction':
          record.interaction = null;
          break;
        case 'bumpAttempts':
          if (record.interaction?.kind === 'puzzle') {
            record.interaction = {
              ...record.interaction,
              attempts: record.interaction.attempts + 1,
            };
          }
          break;
        case 'solvePuzzle':
          if (!record.solvedPuzzles.includes(mutation.puzzleId)) {
            record.solvedPuzzles.push(mutation.puzzleId);
          }
          break;
        case 'infect': {
          // Targets another player; only takes if they are still human.
          const victim = players.get(mutation.targetId);
          if (victim && victim.status === 'human') {
            victim.status = 'infected';
            victim.incubationEndsAt = mutation.incubationEndsAt;
            if (mutation.byId !== mutation.targetId) {
              queueNotification(victim.id, BITE_NOTIFICATION);
            }
          }
          break;
        }
      }
    }
  },

  async getNpcMemory(playerId, npcId) {
    return npcMemory.get(npcMemoryKey(playerId, npcId)) ?? null;
  },

  async setNpcMemory(playerId, npcId, summary) {
    npcMemory.set(npcMemoryKey(playerId, npcId), summary);
  },

  async drainNotifications(playerId) {
    const queue = notifications.get(playerId);
    if (!queue || queue.length === 0) return [];
    notifications.set(playerId, []);
    return queue;
  },

  async notifyPlayers(playerIds, frames) {
    for (const id of playerIds) {
      queueNotification(id, frames);
    }
  },

  async notifyBroadcast(exceptPlayerId, frames) {
    for (const id of players.keys()) {
      if (id !== exceptPlayerId) queueNotification(id, frames);
    }
  },
};
