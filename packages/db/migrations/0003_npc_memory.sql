-- 0003_npc_memory.sql — Last Alive :: M2b AI-character memory

-- What an AI character remembers about a specific player, replayed into the
-- character's context on future conversations so NPCs recognise returning
-- survivors. One row per (player, npc).
create table npc_memory (
  player_id  uuid not null references players(id) on delete cascade,
  npc_id     text not null,
  summary    text not null default '',
  updated_at timestamptz not null default now(),
  primary key (player_id, npc_id)
);

alter table npc_memory enable row level security;

create policy "own npc memory readable" on npc_memory
  for select using (player_id = auth.uid());
