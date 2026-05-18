/**
 * Seed the database for Season 01.
 *
 * Reads the canonical world graph straight from `@last-alive/engine` — the seed
 * has a single source of truth — and upserts it into the season, world_nodes,
 * world_edges and node_state tables. Idempotent: safe to re-run.
 *
 * Usage:
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... pnpm --filter @last-alive/db seed
 */
import { createClient } from '@supabase/supabase-js';
import { season01 } from '@last-alive/engine';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before seeding.');
  process.exit(1);
}

const db = createClient(url, key, { auth: { persistSession: false } });

async function main(): Promise<void> {
  const { data: season, error: seasonError } = await db
    .from('seasons')
    .upsert(
      {
        code: season01.seasonCode,
        name: 'Containment',
        status: 'active',
        world_seed: 'season-01-seed',
      },
      { onConflict: 'code' },
    )
    .select('id')
    .single();

  if (seasonError || !season) {
    throw seasonError ?? new Error('season upsert returned no row');
  }
  const seasonId = (season as { id: number }).id;

  const nodes = Object.values(season01.nodes);

  const { error: nodesError } = await db.from('world_nodes').upsert(
    nodes.map((node) => ({
      id: node.id,
      season_id: seasonId,
      code: node.code,
      name: node.name,
      type: node.type,
      lore: node.lore,
      ascii_art_key: node.asciiArtKey ?? null,
      puzzle_id: node.puzzleId ?? null,
    })),
    { onConflict: 'id' },
  );
  if (nodesError) throw nodesError;

  const { error: stateError } = await db.from('node_state').upsert(
    nodes.map((node) => ({ node_id: node.id, season_id: seasonId })),
    { onConflict: 'node_id' },
  );
  if (stateError) throw stateError;

  const edges = nodes.flatMap((node) =>
    node.edges.map((to) => ({ season_id: seasonId, from_node: node.id, to_node: to })),
  );
  const { error: edgesError } = await db
    .from('world_edges')
    .upsert(edges, { onConflict: 'from_node,to_node' });
  if (edgesError) throw edgesError;

  console.log(
    `Seeded season ${season01.seasonCode} (#${seasonId}) — ${nodes.length} nodes, ${edges.length} edges.`,
  );
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
