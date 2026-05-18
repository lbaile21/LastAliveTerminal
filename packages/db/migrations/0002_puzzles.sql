-- 0002_puzzles.sql — Last Alive :: M2 puzzles, interactions & vitals decay

-- player_season gains: per-player puzzle progress, the active interaction,
-- and the decay clock that `advanceVitals` catches up lazily.
alter table player_season
  add column last_tick_at   timestamptz not null default now(),
  add column solved_puzzles text[]      not null default '{}',
  add column interaction    jsonb;

-- puzzles — METADATA ONLY. Puzzle logic, seeds and answers live in
-- packages/engine; they are never stored here and never sent to the client.
create table puzzles (
  id      text primary key,
  kind    text not null,
  summary text not null default ''
);

-- puzzle_attempts — per-player attempt log, backing anti-brute-force throttling.
create table puzzle_attempts (
  id            bigserial primary key,
  player_id     uuid not null references players(id) on delete cascade,
  season_id     integer not null references seasons(id) on delete cascade,
  puzzle_id     text not null,
  node_id       text references world_nodes(id),
  solved        boolean not null default false,
  attempt_count integer not null default 0,
  solved_at     timestamptz,
  created_at    timestamptz not null default now(),
  unique (player_id, season_id, puzzle_id)
);

alter table puzzles        enable row level security;
alter table puzzle_attempts enable row level security;

create policy "puzzle metadata is readable" on puzzles
  for select using (true);
create policy "own puzzle attempts readable" on puzzle_attempts
  for select using (player_id = auth.uid());
