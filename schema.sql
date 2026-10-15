-- YaarJam Phase 02: secure guest rooms + member list + realtime room-lobby updates.
-- Paste the entire file into Supabase Dashboard > SQL Editor and run once.
-- This SQL intentionally does NOT add direct browser INSERT/UPDATE/DELETE access to the tables.

create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[A-Z0-9]{6,8}$'),
  room_name text not null check (char_length(room_name) between 1 and 36),
  game_id text not null check (game_id in (
    'truth-dare-friends', 'couple-truth-dare', 'tic-tac-toe', 'would-you-rather',
    'partner-quiz', 'chess', 'ludo', 'this-or-that', 'never-have-i-ever',
    'most-likely-to', 'our-story', 'guess-word'
  )),
  host_user_id uuid not null references auth.users(id) on delete cascade,
  max_players smallint not null default 10 check (max_players between 2 and 10),
  status text not null default 'open' check (status in ('open', 'closed')),
  lobby_version integer not null default 0,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '12 hours')
);

alter table public.rooms add column if not exists lobby_version integer not null default 0;

create table if not exists public.room_players (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 18),
  joined_at timestamptz not null default now(),
  unique (room_id, user_id)
);

create index if not exists room_players_room_joined_idx
  on public.room_players (room_id, joined_at);
create index if not exists rooms_status_created_idx
  on public.rooms (status, created_at desc);

alter table public.rooms enable row level security;
alter table public.room_players enable row level security;

-- A narrowly-scoped SECURITY DEFINER helper avoids recursive membership-table RLS checks.
create or replace function public.is_room_member(p_room_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.room_players rp
    where rp.room_id = p_room_id
      and rp.user_id = (select auth.uid())
  );
$$;

revoke all on function public.is_room_member(uuid) from public, anon;
grant execute on function public.is_room_member(uuid) to authenticated;

-- Only members can read a room and its player list.
drop policy if exists "room members can read room" on public.rooms;
create policy "room members can read room"
  on public.rooms for select to authenticated
  using (public.is_room_member(id));

drop policy if exists "room members can read player list" on public.room_players;
create policy "room members can read player list"
  on public.room_players for select to authenticated
  using (public.is_room_member(room_id));

-- Browsers get read permission only; writes must pass through validated RPC functions.
revoke all on public.rooms from public, anon, authenticated;
revoke all on public.room_players from public, anon, authenticated;
grant select on public.rooms, public.room_players to authenticated;

create or replace function public.create_room(
  p_room_name text,
  p_game_id text,
  p_display_name text,
  p_max_players integer default 10
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_code text;
  v_alphabet text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v_room public.rooms%rowtype;
  v_room_name text := btrim(coalesce(p_room_name, ''));
  v_display_name text := btrim(coalesce(p_display_name, ''));
  v_max_players integer := coalesce(p_max_players, 10);
  v_try integer;
  v_i integer;
begin
  if v_user_id is null then
    raise exception 'Start a guest session and try again.' using errcode = '28000';
  end if;
  if char_length(v_room_name) < 1 or char_length(v_room_name) > 36 then
    raise exception 'Room name must be 1–36 characters.' using errcode = '22023';
  end if;
  if char_length(v_display_name) < 1 or char_length(v_display_name) > 18 then
    raise exception 'Player name must be 1–18 characters.' using errcode = '22023';
  end if;
  if p_game_id is null or p_game_id not in (
    'truth-dare-friends', 'couple-truth-dare', 'tic-tac-toe', 'would-you-rather',
    'partner-quiz', 'chess', 'ludo', 'this-or-that', 'never-have-i-ever',
    'most-likely-to', 'our-story', 'guess-word'
  ) then
    raise exception 'That game is not available in this version.' using errcode = '22023';
  end if;
  if v_max_players < 2 or v_max_players > 10 then
    raise exception 'Room size must be from 2 to 10 players.' using errcode = '22023';
  end if;

  for v_try in 1..5 loop
    v_code := '';
    for v_i in 1..8 loop
      v_code := v_code || substr(v_alphabet, floor(random() * char_length(v_alphabet))::integer + 1, 1);
    end loop;
    begin
      insert into public.rooms (code, room_name, game_id, host_user_id, max_players)
      values (v_code, v_room_name, p_game_id, v_user_id, v_max_players)
      returning * into v_room;
      exit;
    exception when unique_violation then
      if v_try = 5 then
        raise exception 'Could not create a unique room code. Please try again.' using errcode = '23505';
      end if;
    end;
  end loop;

  insert into public.room_players (room_id, user_id, display_name)
  values (v_room.id, v_user_id, v_display_name);

  update public.rooms set lobby_version = lobby_version + 1
  where id = v_room.id
  returning * into v_room;

  return to_jsonb(v_room);
end;
$$;

create or replace function public.join_room(
  p_code text,
  p_display_name text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_code text := upper(btrim(coalesce(p_code, '')));
  v_display_name text := btrim(coalesce(p_display_name, ''));
  v_room public.rooms%rowtype;
  v_count integer;
begin
  if v_user_id is null then
    raise exception 'Start a guest session and try again.' using errcode = '28000';
  end if;
  if v_code !~ '^[A-Z0-9]{6,8}$' then
    raise exception 'Enter a valid 6–8 character room code.' using errcode = '22023';
  end if;
  if char_length(v_display_name) < 1 or char_length(v_display_name) > 18 then
    raise exception 'Player name must be 1–18 characters.' using errcode = '22023';
  end if;

  select * into v_room
  from public.rooms r
  where r.code = v_code
  for update;

  if not found or v_room.status <> 'open' or v_room.expires_at <= now() then
    raise exception 'Room not found, closed, or expired. Check the code with your friend.' using errcode = 'P0002';
  end if;

  if exists (
    select 1 from public.room_players rp
    where rp.room_id = v_room.id and rp.user_id = v_user_id
  ) then
    return to_jsonb(v_room);
  end if;

  select count(*) into v_count
  from public.room_players rp
  where rp.room_id = v_room.id;
  if v_count >= v_room.max_players then
    raise exception 'This room is full.' using errcode = '54000';
  end if;

  if exists (
    select 1 from public.room_players rp
    where rp.room_id = v_room.id and lower(rp.display_name) = lower(v_display_name)
  ) then
    raise exception 'That display name is already used in this room. Try another.' using errcode = '23505';
  end if;

  insert into public.room_players (room_id, user_id, display_name)
  values (v_room.id, v_user_id, v_display_name);

  update public.rooms set lobby_version = lobby_version + 1
  where id = v_room.id
  returning * into v_room;

  return to_jsonb(v_room);
end;
$$;

create or replace function public.leave_room(p_room_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_room public.rooms%rowtype;
  v_next_host uuid;
  v_deleted integer := 0;
begin
  if v_user_id is null then
    raise exception 'Start a guest session and try again.' using errcode = '28000';
  end if;

  select * into v_room
  from public.rooms r
  where r.id = p_room_id
  for update;

  if not found then
    return jsonb_build_object('left', false, 'closed', true);
  end if;

  delete from public.room_players rp
  where rp.room_id = p_room_id and rp.user_id = v_user_id;
  get diagnostics v_deleted = row_count;
  if v_deleted = 0 then
    return jsonb_build_object('left', false, 'closed', v_room.status = 'closed');
  end if;

  if v_room.host_user_id = v_user_id then
    select rp.user_id into v_next_host
    from public.room_players rp
    where rp.room_id = p_room_id
    order by rp.joined_at asc
    limit 1;

    if v_next_host is null then
      update public.rooms set status = 'closed', lobby_version = lobby_version + 1 where id = p_room_id;
      return jsonb_build_object('left', true, 'closed', true);
    else
      update public.rooms set host_user_id = v_next_host, lobby_version = lobby_version + 1 where id = p_room_id;
    end if;
  else
    update public.rooms set lobby_version = lobby_version + 1 where id = p_room_id;
  end if;

  return jsonb_build_object('left', true, 'closed', false);
end;
$$;

revoke all on function public.create_room(text, text, text, integer) from public, anon;
revoke all on function public.join_room(text, text) from public, anon;
revoke all on function public.leave_room(uuid) from public, anon;
grant execute on function public.create_room(text, text, text, integer) to authenticated;
grant execute on function public.join_room(text, text) to authenticated;
grant execute on function public.leave_room(uuid) to authenticated;

-- Enable database-change events for the small private-room lobby MVP.
-- Supabase Realtime's Postgres Changes feature must also be enabled for this project.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'rooms'
    ) then
      execute 'alter publication supabase_realtime add table public.rooms';
    end if;
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'room_players'
    ) then
      execute 'alter publication supabase_realtime add table public.room_players';
    end if;
  end if;
end;
$$;
