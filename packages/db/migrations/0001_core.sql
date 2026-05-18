-- 0001_core.sql — Last Alive :: M0 core schema
--
-- The world, the players, and each player's per-season run. Gameplay tables
-- have Row Level Security ON with NO insert/update policies: every gameplay
-- write goes through a SECURITY DEFINER function or the service-role API, so a
-- client JWT can never mutate game state directly. This is the database-level
-- half of the server-authoritative design (the engine is the other half).

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type player_status as enum ('human', 'infected', 'zombie', 'dead');
create type season_status as enum ('upcoming', 'active', 'ended');
create type node_type as enum (
  'gate', 'atrium', 'lab', 'vault', 'sewer', 'street', 'safehouse', 'comms'
);

-- ---------------------------------------------------------------------------
-- players — one row per account (humans and AI agents alike)
-- ---------------------------------------------------------------------------
create table players (
  id            uuid primary key default gen_random_uuid(),
  callsign      text unique not null,
  wallet_address text,
  cosmetics     jsonb not null default '{}'::jsonb,
  push_opt_in   boolean not null default false,
  is_agent      boolean not null default false,
  created_at    timestamptz not null default now(),
  last_seen_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- seasons — the persistent world runs in ~2-4 week seasons, then resets
-- ---------------------------------------------------------------------------
create table seasons (
  id          serial primary key,
  code        text unique not null,
  name        text not null,
  status      season_status not null default 'upcoming',
  world_seed  text not null,
  starts_at   timestamptz,
  ends_at     timestamptz,
  onchain_tx  text,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- world_nodes / world_edges — the per-season map graph (frozen once a season
-- opens; mirrors the WorldGraph shape in packages/engine)
-- ---------------------------------------------------------------------------
create table world_nodes (
  id            text primary key,
  season_id     integer not null references seasons(id) on delete cascade,
  code          text not null,
  name          text not null,
  type          node_type not null,
  lore          text not null default '',
  ascii_art_key text,
  puzzle_id     text,
  unique (season_id, code)
);

create table world_edges (
  id               bigserial primary key,
  season_id        integer not null references seasons(id) on delete cascade,
  from_node        text not null references world_nodes(id) on delete cascade,
  to_node          text not null references world_nodes(id) on delete cascade,
  unlock_condition jsonb not null default '{}'::jsonb,
  unique (from_node, to_node)
);

-- ---------------------------------------------------------------------------
-- node_state — the dynamic, tick-mutated state of each node
-- ---------------------------------------------------------------------------
create table node_state (
  node_id         text primary key references world_nodes(id) on delete cascade,
  season_id       integer not null references seasons(id) on delete cascade,
  infection_level integer not null default 0 check (infection_level between 0 and 100),
  power_on        boolean not null default true,
  occupants_cache integer not null default 0,
  event_flags     jsonb not null default '{}'::jsonb,
  updated_at      timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- player_season — one row per player per season: their actual run
-- ---------------------------------------------------------------------------
create table player_season (
  player_id          uuid not null references players(id) on delete cascade,
  season_id          integer not null references seasons(id) on delete cascade,
  status             player_status not null default 'human',
  current_node_id    text references world_nodes(id),
  health             integer not null default 100 check (health between 0 and 100),
  hunger             integer not null default 100 check (hunger between 0 and 100),
  energy             integer not null default 100 check (energy between 0 and 100),
  incubation_ends_at timestamptz,
  infected_by        uuid references players(id),
  protection_until   timestamptz,
  score              integer not null default 0,
  safehouse_id       uuid,
  -- bumped on every write; the API uses it for optimistic-concurrency checks
  updated_at         timestamptz not null default now(),
  primary key (player_id, season_id)
);

create index player_season_node_idx on player_season (current_node_id);
create index player_season_season_idx on player_season (season_id);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table players       enable row level security;
alter table seasons       enable row level security;
alter table world_nodes   enable row level security;
alter table world_edges   enable row level security;
alter table node_state    enable row level security;
alter table player_season enable row level security;

-- World and season data is public-readable (it is not secret).
create policy "seasons are readable"     on seasons     for select using (true);
create policy "world_nodes are readable" on world_nodes for select using (true);
create policy "world_edges are readable" on world_edges for select using (true);
create policy "node_state is readable"   on node_state  for select using (true);

-- A player may read only their own account row and their own season run.
create policy "own player row readable" on players
  for select using (id = auth.uid());
create policy "own season run readable" on player_season
  for select using (player_id = auth.uid());

-- Deliberately NO insert/update/delete policies on gameplay tables.
-- All mutations are performed by the service role via the command API.
