# @last-alive/db

Supabase Postgres schema for Last Alive.

## Migrations

`migrations/` holds ordered SQL migrations. `0001_core.sql` is the M0 core
schema: players, seasons, the world graph, node state, and per-season runs.

Apply with the Supabase CLI against a local stack:

```bash
supabase start
supabase db reset        # replays every migration in order
```

## Design notes

- **RLS is on for every gameplay table** with no client-facing write policies.
  Game state changes only through the service-role command API, which runs the
  server-authoritative engine. A stolen or forged client JWT cannot mutate the
  world.
- `player_season.updated_at` backs optimistic-concurrency checks in the command
  handler — a write only commits if the row has not changed since it was read.
- `world_nodes` mirrors the `WorldGraph` shape in `packages/engine`; a season's
  map is frozen into these tables before the season opens.

Later milestones add: `puzzles` / `puzzle_attempts` (M2), `safehouses` /
`events` / `messages` (M3), the AI tables and `world_ticks` (M2–M4), and
`achievements` (M4).
