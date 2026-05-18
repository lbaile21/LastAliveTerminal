import { randomUUID } from 'node:crypto';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { advancePlayer, season01 } from '@last-alive/engine';
import type { GameContext, Interaction, OccupantView, StateMutation } from '@last-alive/engine';
import type { Frame, PlayerStatus } from '@last-alive/shared';
import type { GameStore } from './store';
import { BITE_NOTIFICATION } from './store';
import { generateCallsign } from './callsign';

/**
 * Supabase-backed game store (production path).
 *
 * Uses the service-role key — it IS the server authority and intentionally
 * bypasses RLS. The static world graph stays in code (`season01`); only
 * dynamic player state is persisted.
 */

let client: SupabaseClient | null = null;

function db(): SupabaseClient {
  if (!client) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      throw new Error('Supabase store used without SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY');
    }
    client = createClient(url, key, { auth: { persistSession: false } });
  }
  return client;
}

const nowIso = (): string => new Date().toISOString();

/** How a status appears to OTHER players — infected looks human. */
function apparentStatus(status: PlayerStatus): OccupantView['apparentStatus'] {
  return status === 'zombie' ? 'zombie' : status === 'dead' ? 'dead' : 'human';
}

async function activeSeasonId(): Promise<number> {
  const { data } = await db().from('seasons').select('id').eq('status', 'active').limit(1).maybeSingle();
  const row = data as { id: number } | null;
  if (!row) {
    throw new Error('No active season — apply migrations and run `pnpm --filter @last-alive/db seed`.');
  }
  return row.id;
}

interface RunRow {
  status: PlayerStatus;
  current_node_id: string | null;
  health: number;
  hunger: number;
  energy: number;
  incubation_ends_at: string | null;
  solved_puzzles: string[] | null;
  interaction: Interaction | null;
  last_tick_at: string;
  players: { callsign: string } | null;
}

async function ensureRun(playerId: string, seasonId: number): Promise<void> {
  await db()
    .from('player_season')
    .upsert(
      { player_id: playerId, season_id: seasonId, current_node_id: season01.startNodeId },
      { onConflict: 'player_id,season_id', ignoreDuplicates: true },
    );
}

export const supabaseStore: GameStore = {
  async ensurePlayer(playerId) {
    const seasonId = await activeSeasonId();
    const id = playerId ?? randomUUID();
    await db()
      .from('players')
      .upsert({ id, callsign: generateCallsign(id) }, { onConflict: 'id', ignoreDuplicates: true });
    await ensureRun(id, seasonId);
    return id;
  },

  async loadContext(playerId): Promise<GameContext | null> {
    const seasonId = await activeSeasonId();
    const { data } = await db()
      .from('player_season')
      .select(
        'status, current_node_id, health, hunger, energy, incubation_ends_at, solved_puzzles, interaction, last_tick_at, players(callsign)',
      )
      .eq('player_id', playerId)
      .eq('season_id', seasonId)
      .maybeSingle();

    const row = data as RunRow | null;
    if (!row) return null;

    const now = Date.now();
    const currentNodeId = row.current_node_id ?? season01.startNodeId;

    // Catch the player's vitals and status up to the present.
    const advanced = advancePlayer(
      {
        status: row.status,
        health: row.health,
        hunger: row.hunger,
        energy: row.energy,
        incubationEndsAt: row.incubation_ends_at ? new Date(row.incubation_ends_at).getTime() : null,
        lastTickAt: new Date(row.last_tick_at).getTime(),
      },
      now,
    );
    await db()
      .from('player_season')
      .update({
        status: advanced.status,
        health: advanced.health,
        hunger: advanced.hunger,
        energy: advanced.energy,
        incubation_ends_at:
          advanced.incubationEndsAt === null
            ? null
            : new Date(advanced.incubationEndsAt).toISOString(),
        last_tick_at: new Date(advanced.lastTickAt).toISOString(),
      })
      .eq('player_id', playerId)
      .eq('season_id', seasonId);

    // Other players at the same node.
    const { data: otherData } = await db()
      .from('player_season')
      .select('player_id, status, players(callsign)')
      .eq('season_id', seasonId)
      .eq('current_node_id', currentNodeId)
      .neq('player_id', playerId);
    const others =
      (otherData as { player_id: string; status: PlayerStatus; players: { callsign: string } | null }[] | null) ??
      [];
    const occupants: OccupantView[] = others.map((o) => ({
      id: o.player_id,
      callsign: o.players?.callsign ?? generateCallsign(o.player_id),
      apparentStatus: apparentStatus(o.status),
    }));

    return {
      player: {
        id: playerId,
        callsign: row.players?.callsign ?? generateCallsign(playerId),
        status: advanced.status,
        currentNodeId,
        health: advanced.health,
        hunger: advanced.hunger,
        energy: advanced.energy,
        incubationEndsAt: advanced.incubationEndsAt,
        solvedPuzzles: row.solved_puzzles ?? [],
        interaction: row.interaction,
      },
      occupants,
      world: season01,
      now,
    };
  },

  async applyMutations(playerId, mutations: StateMutation[]) {
    if (mutations.length === 0) return;
    const seasonId = await activeSeasonId();

    for (const mutation of mutations) {
      switch (mutation.type) {
        case 'move':
          await db()
            .from('player_season')
            .update({ current_node_id: mutation.toNodeId, updated_at: nowIso() })
            .eq('player_id', playerId)
            .eq('season_id', seasonId);
          break;

        case 'startInteraction':
          await db()
            .from('player_season')
            .update({ interaction: mutation.interaction, updated_at: nowIso() })
            .eq('player_id', playerId)
            .eq('season_id', seasonId);
          break;

        case 'endInteraction':
          await db()
            .from('player_season')
            .update({ interaction: null, updated_at: nowIso() })
            .eq('player_id', playerId)
            .eq('season_id', seasonId);
          break;

        case 'bumpAttempts': {
          const { data } = await db()
            .from('player_season')
            .select('interaction')
            .eq('player_id', playerId)
            .eq('season_id', seasonId)
            .maybeSingle();
          const interaction = (data as { interaction: Interaction | null } | null)?.interaction;
          if (interaction?.kind === 'puzzle') {
            await db()
              .from('player_season')
              .update({
                interaction: { ...interaction, attempts: interaction.attempts + 1 },
                updated_at: nowIso(),
              })
              .eq('player_id', playerId)
              .eq('season_id', seasonId);
          }
          break;
        }

        case 'solvePuzzle': {
          const { data } = await db()
            .from('player_season')
            .select('solved_puzzles')
            .eq('player_id', playerId)
            .eq('season_id', seasonId)
            .maybeSingle();
          const solved = (data as { solved_puzzles: string[] | null } | null)?.solved_puzzles ?? [];
          if (!solved.includes(mutation.puzzleId)) {
            await db()
              .from('player_season')
              .update({ solved_puzzles: [...solved, mutation.puzzleId], updated_at: nowIso() })
              .eq('player_id', playerId)
              .eq('season_id', seasonId);
          }
          break;
        }

        case 'infect': {
          // Only takes if the target is still human; `.select()` reports it.
          const { data } = await db()
            .from('player_season')
            .update({
              status: 'infected',
              incubation_ends_at: new Date(mutation.incubationEndsAt).toISOString(),
              infected_by: mutation.byId,
              updated_at: nowIso(),
            })
            .eq('player_id', mutation.targetId)
            .eq('season_id', seasonId)
            .eq('status', 'human')
            .select('player_id');
          const affected = (data as { player_id: string }[] | null) ?? [];
          if (affected.length > 0 && mutation.byId !== mutation.targetId) {
            await db()
              .from('notifications')
              .insert(BITE_NOTIFICATION.map((frame) => ({ player_id: mutation.targetId, frame })));
          }
          break;
        }
      }
    }
  },

  async getNpcMemory(playerId, npcId) {
    const { data } = await db()
      .from('npc_memory')
      .select('summary')
      .eq('player_id', playerId)
      .eq('npc_id', npcId)
      .maybeSingle();
    return (data as { summary: string } | null)?.summary ?? null;
  },

  async setNpcMemory(playerId, npcId, summary) {
    await db()
      .from('npc_memory')
      .upsert(
        { player_id: playerId, npc_id: npcId, summary, updated_at: nowIso() },
        { onConflict: 'player_id,npc_id' },
      );
  },

  async drainNotifications(playerId) {
    const { data } = await db()
      .from('notifications')
      .select('id, frame')
      .eq('player_id', playerId)
      .order('id', { ascending: true });
    const rows = (data as { id: number; frame: Frame }[] | null) ?? [];
    if (rows.length === 0) return [];
    await db()
      .from('notifications')
      .delete()
      .in(
        'id',
        rows.map((r) => r.id),
      );
    return rows.map((r) => r.frame);
  },

  async notifyPlayers(playerIds, frames) {
    if (playerIds.length === 0 || frames.length === 0) return;
    const rows = playerIds.flatMap((pid) => frames.map((frame) => ({ player_id: pid, frame })));
    await db().from('notifications').insert(rows);
  },

  async notifyBroadcast(exceptPlayerId, frames) {
    if (frames.length === 0) return;
    const seasonId = await activeSeasonId();
    const { data } = await db()
      .from('player_season')
      .select('player_id')
      .eq('season_id', seasonId);
    const ids = ((data as { player_id: string }[] | null) ?? [])
      .map((r) => r.player_id)
      .filter((id) => id !== exceptPlayerId);
    await this.notifyPlayers(ids, frames);
  },
};
