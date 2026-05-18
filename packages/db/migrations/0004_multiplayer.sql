-- 0004_multiplayer.sql — Last Alive :: M3 async multiplayer

-- notifications — out-of-band frames delivered to a player on their next poll
-- or command (a bite, later: messages, safehouse events). The poll-based
-- delivery stands in for Web Push until that infrastructure lands.
create table notifications (
  id         bigserial primary key,
  player_id  uuid not null references players(id) on delete cascade,
  frame      jsonb not null,
  created_at timestamptz not null default now()
);

create index notifications_player_idx on notifications (player_id, id);

alter table notifications enable row level security;

create policy "own notifications readable" on notifications
  for select using (player_id = auth.uid());

-- player_season.infected_by already exists (0001); no schema change needed for
-- infection itself — M3 just begins writing it.
