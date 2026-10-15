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
create index if not exists rooms_host_user_id_idx
  on public.rooms (host_user_id);
create index if not exists room_players_user_joined_idx
  on public.room_players (user_id, joined_at desc);

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
    'truth-dare-friends', 'couple-truth-dare', 'tic-tac-toe'
  ) then
    raise exception 'That game is listed for a future update and cannot create a room in V1.' using errcode = '22023';
  end if;
  if v_max_players < 2 or v_max_players > 10 then
    raise exception 'Room size must be from 2 to 10 players.' using errcode = '22023';
  end if;
  if p_game_id in ('couple-truth-dare', 'tic-tac-toe') and v_max_players <> 2 then
    raise exception 'This game supports exactly two players in V1.' using errcode = '22023';
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
  if v_room.game_id not in ('truth-dare-friends', 'couple-truth-dare', 'tic-tac-toe') then
    raise exception 'This game is not playable in V1 yet.' using errcode = '22023';
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
-- YaarJam Phase 03: secure, realtime Tic Tac Toe game state.
-- Run this AFTER the Phase 02 supabase/schema.sql. It is also appended to schema.sql
-- for fresh projects. Browser clients can SELECT as room members; all writes use RPC.

create table if not exists public.tic_tac_toe_games (
  room_id uuid primary key references public.rooms(id) on delete cascade,
  board text[] not null default array[null::text, null, null, null, null, null, null, null, null],
  status text not null default 'waiting' check (status in ('waiting', 'playing', 'x_won', 'o_won', 'draw')),
  x_user_id uuid references auth.users(id) on delete set null,
  o_user_id uuid references auth.users(id) on delete set null,
  current_turn_user_id uuid references auth.users(id) on delete set null,
  winner_user_id uuid references auth.users(id) on delete set null,
  x_rematch_ready boolean not null default false,
  o_rematch_ready boolean not null default false,
  updated_at timestamptz not null default now(),
  constraint ttt_board_has_nine_cells check (array_length(board, 1) = 9),
  constraint ttt_players_distinct check (x_user_id is null or o_user_id is null or x_user_id <> o_user_id)
);

create index if not exists tic_tac_toe_games_x_user_id_idx on public.tic_tac_toe_games(x_user_id);
create index if not exists tic_tac_toe_games_o_user_id_idx on public.tic_tac_toe_games(o_user_id);
create index if not exists tic_tac_toe_games_current_turn_idx on public.tic_tac_toe_games(current_turn_user_id);
create index if not exists tic_tac_toe_games_winner_user_idx on public.tic_tac_toe_games(winner_user_id);

alter table public.tic_tac_toe_games enable row level security;
revoke all on public.tic_tac_toe_games from public, anon, authenticated;
grant select on public.tic_tac_toe_games to authenticated;

drop policy if exists "room members can read tic tac toe state" on public.tic_tac_toe_games;
create policy "room members can read tic tac toe state"
  on public.tic_tac_toe_games for select to authenticated
  using (public.is_room_member(room_id));

create or replace function public.start_ttt_game(p_room_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_room public.rooms%rowtype;
  v_game public.tic_tac_toe_games%rowtype;
  v_x_user uuid;
  v_o_user uuid;
begin
  if v_user_id is null then
    raise exception 'Start a guest session and try again.' using errcode = '28000';
  end if;
  if not public.is_room_member(p_room_id) then
    raise exception 'You are not a member of this room.' using errcode = '42501';
  end if;

  select * into v_room from public.rooms r where r.id = p_room_id;
  if not found or v_room.game_id <> 'tic-tac-toe' then
    raise exception 'This room is not a Tic Tac Toe room.' using errcode = '22023';
  end if;
  if v_room.status <> 'open' or v_room.expires_at <= now() then
    raise exception 'This room is closed or expired.' using errcode = '22023';
  end if;

  insert into public.tic_tac_toe_games (room_id)
  values (p_room_id)
  on conflict (room_id) do nothing;

  select * into v_game
  from public.tic_tac_toe_games g
  where g.room_id = p_room_id
  for update;

  if v_game.status = 'waiting' then
    select rp.user_id into v_x_user
    from public.room_players rp
    where rp.room_id = p_room_id
    order by rp.joined_at asc, rp.id asc
    limit 1 offset 0;

    select rp.user_id into v_o_user
    from public.room_players rp
    where rp.room_id = p_room_id
    order by rp.joined_at asc, rp.id asc
    limit 1 offset 1;

    if v_x_user is null then
      raise exception 'Join the room before starting a game.' using errcode = '22023';
    end if;

    if v_o_user is null then
      update public.tic_tac_toe_games
      set x_user_id = v_x_user,
          o_user_id = null,
          current_turn_user_id = v_x_user,
          status = 'waiting',
          updated_at = now()
      where room_id = p_room_id
      returning * into v_game;
    else
      update public.tic_tac_toe_games
      set board = array[null::text, null, null, null, null, null, null, null, null],
          x_user_id = v_x_user,
          o_user_id = v_o_user,
          current_turn_user_id = v_x_user,
          winner_user_id = null,
          status = 'playing',
          x_rematch_ready = false,
          o_rematch_ready = false,
          updated_at = now()
      where room_id = p_room_id
      returning * into v_game;
    end if;
  end if;

  return to_jsonb(v_game);
end;
$$;

create or replace function public.play_ttt_move(p_room_id uuid, p_cell integer)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_room public.rooms%rowtype;
  v_game public.tic_tac_toe_games%rowtype;
  v_board text[];
  v_mark text;
  v_status text := 'playing';
  v_winner text;
  v_winner_user uuid;
  v_next_user uuid;
begin
  if v_user_id is null then
    raise exception 'Start a guest session and try again.' using errcode = '28000';
  end if;
  if p_cell is null or p_cell < 0 or p_cell > 8 then
    raise exception 'Choose a cell between 1 and 9.' using errcode = '22023';
  end if;
  if not public.is_room_member(p_room_id) then
    raise exception 'You are not a member of this room.' using errcode = '42501';
  end if;

  select * into v_room from public.rooms r where r.id = p_room_id;
  if not found or v_room.game_id <> 'tic-tac-toe' or v_room.status <> 'open' or v_room.expires_at <= now() then
    raise exception 'This Tic Tac Toe room is not active.' using errcode = '22023';
  end if;

  select * into v_game
  from public.tic_tac_toe_games g
  where g.room_id = p_room_id
  for update;
  if not found then
    raise exception 'Game has not been initialized yet. Refresh and try again.' using errcode = 'P0002';
  end if;
  if v_game.status <> 'playing' then
    raise exception 'This round is not currently accepting moves.' using errcode = '22023';
  end if;
  if v_game.current_turn_user_id <> v_user_id then
    raise exception 'It is the other player''s turn.' using errcode = '42501';
  end if;

  if v_game.x_user_id = v_user_id then
    v_mark := 'X';
    v_next_user := v_game.o_user_id;
  elsif v_game.o_user_id = v_user_id then
    v_mark := 'O';
    v_next_user := v_game.x_user_id;
  else
    raise exception 'You are not one of the two players in this game.' using errcode = '42501';
  end if;

  v_board := v_game.board;
  if v_board[p_cell + 1] is not null then
    raise exception 'That cell is already occupied.' using errcode = '22023';
  end if;
  v_board[p_cell + 1] := v_mark;

  if (v_board[1] is not null and v_board[1] = v_board[2] and v_board[2] = v_board[3])
    or (v_board[4] is not null and v_board[4] = v_board[5] and v_board[5] = v_board[6])
    or (v_board[7] is not null and v_board[7] = v_board[8] and v_board[8] = v_board[9])
    or (v_board[1] is not null and v_board[1] = v_board[4] and v_board[4] = v_board[7])
    or (v_board[2] is not null and v_board[2] = v_board[5] and v_board[5] = v_board[8])
    or (v_board[3] is not null and v_board[3] = v_board[6] and v_board[6] = v_board[9])
    or (v_board[1] is not null and v_board[1] = v_board[5] and v_board[5] = v_board[9])
    or (v_board[3] is not null and v_board[3] = v_board[5] and v_board[5] = v_board[7]) then
    v_status := case when v_mark = 'X' then 'x_won' else 'o_won' end;
    v_winner := v_mark;
    v_winner_user := v_user_id;
    v_next_user := null;
  elsif not exists (select 1 from unnest(v_board) as u(cell) where u.cell is null) then
    v_status := 'draw';
    v_next_user := null;
  end if;

  update public.tic_tac_toe_games
  set board = v_board,
      status = v_status,
      current_turn_user_id = v_next_user,
      winner_user_id = v_winner_user,
      updated_at = now()
  where room_id = p_room_id
  returning * into v_game;

  return to_jsonb(v_game);
end;
$$;

create or replace function public.request_ttt_rematch(p_room_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_game public.tic_tac_toe_games%rowtype;
  v_room public.rooms%rowtype;
  v_x_ready boolean;
  v_o_ready boolean;
begin
  if v_user_id is null then
    raise exception 'Start a guest session and try again.' using errcode = '28000';
  end if;
  if not public.is_room_member(p_room_id) then
    raise exception 'You are not a member of this room.' using errcode = '42501';
  end if;

  select * into v_game
  from public.tic_tac_toe_games g
  where g.room_id = p_room_id
  for update;
  if not found then
    raise exception 'Game state was not found.' using errcode = 'P0002';
  end if;
  select * into v_room from public.rooms r where r.id = p_room_id;
  if not found or v_room.status <> 'open' or v_room.expires_at <= now() then
    raise exception 'This room is closed or expired.' using errcode = '22023';
  end if;
  if v_game.status not in ('x_won', 'o_won', 'draw') then
    raise exception 'Finish the current round before requesting a rematch.' using errcode = '22023';
  end if;

  if v_user_id = v_game.x_user_id then
    v_x_ready := true;
    v_o_ready := v_game.o_rematch_ready;
  elsif v_user_id = v_game.o_user_id then
    v_x_ready := v_game.x_rematch_ready;
    v_o_ready := true;
  else
    raise exception 'Only the two players can request a rematch.' using errcode = '42501';
  end if;

  if v_x_ready and v_o_ready then
    -- Swap X/O ownership between rounds and let the new X player start.
    update public.tic_tac_toe_games
    set board = array[null::text, null, null, null, null, null, null, null, null],
        x_user_id = v_game.o_user_id,
        o_user_id = v_game.x_user_id,
        current_turn_user_id = v_game.o_user_id,
        winner_user_id = null,
        status = 'playing',
        x_rematch_ready = false,
        o_rematch_ready = false,
        updated_at = now()
    where room_id = p_room_id
    returning * into v_game;
  else
    update public.tic_tac_toe_games
    set x_rematch_ready = v_x_ready,
        o_rematch_ready = v_o_ready,
        updated_at = now()
    where room_id = p_room_id
    returning * into v_game;
  end if;

  return to_jsonb(v_game);
end;
$$;

-- If a player leaves mid-match, reset the round for whoever remains so a new guest can join.
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
  v_remaining_user uuid;
  v_deleted integer := 0;
  v_closed boolean := false;
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
    order by rp.joined_at asc, rp.id asc
    limit 1;

    if v_next_host is null then
      update public.rooms set status = 'closed', lobby_version = lobby_version + 1 where id = p_room_id;
      v_closed := true;
    else
      update public.rooms set host_user_id = v_next_host, lobby_version = lobby_version + 1 where id = p_room_id;
    end if;
  else
    update public.rooms set lobby_version = lobby_version + 1 where id = p_room_id;
  end if;

  select rp.user_id into v_remaining_user
  from public.room_players rp
  where rp.room_id = p_room_id
  order by rp.joined_at asc, rp.id asc
  limit 1;

  if v_room.game_id = 'tic-tac-toe' then
    update public.tic_tac_toe_games
    set board = array[null::text, null, null, null, null, null, null, null, null],
        status = 'waiting',
        x_user_id = v_remaining_user,
        o_user_id = null,
        current_turn_user_id = v_remaining_user,
        winner_user_id = null,
        x_rematch_ready = false,
        o_rematch_ready = false,
        updated_at = now()
    where room_id = p_room_id;
  end if;

  return jsonb_build_object('left', true, 'closed', v_closed);
end;
$$;

revoke all on function public.leave_room(uuid) from public, anon;
grant execute on function public.leave_room(uuid) to authenticated;

revoke all on function public.start_ttt_game(uuid) from public, anon;
revoke all on function public.play_ttt_move(uuid, integer) from public, anon;
revoke all on function public.request_ttt_rematch(uuid) from public, anon;
grant execute on function public.start_ttt_game(uuid) to authenticated;
grant execute on function public.play_ttt_move(uuid, integer) to authenticated;
grant execute on function public.request_ttt_rematch(uuid) to authenticated;

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') and not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'tic_tac_toe_games'
  ) then
    execute 'alter publication supabase_realtime add table public.tic_tac_toe_games';
  end if;
end;
$$;

-- ==================== PHASE 05: TRUTH OR DARE ====================
-- YaarJam Phase 05 — secure, shared Truth or Dare state.
-- Run after the existing Phase 02+03 schema (supabase/schema.sql).
-- All writes pass through SECURITY DEFINER RPCs with a pinned empty search_path.

create table if not exists public.truth_or_dare_prompts (
  id text primary key,
  mode text not null check (mode in ('friends', 'couples')),
  kind text not null check (kind in ('truth', 'dare')),
  prompt_text text not null check (char_length(prompt_text) between 1 and 500),
  enabled boolean not null default true
);

create table if not exists public.truth_or_dare_games (
  room_id uuid primary key references public.rooms(id) on delete cascade,
  mode text not null check (mode in ('friends', 'couples')),
  player_order uuid[] not null default '{}'::uuid[],
  current_turn_index integer not null default 0 check (current_turn_index >= 0),
  current_turn_user_id uuid references auth.users(id) on delete set null,
  current_prompt_id text references public.truth_or_dare_prompts(id) on delete set null,
  current_prompt_kind text check (current_prompt_kind in ('truth', 'dare')),
  current_prompt_text text,
  used_prompt_ids text[] not null default '{}'::text[],
  completed_count integer not null default 0 check (completed_count >= 0),
  skipped_count integer not null default 0 check (skipped_count >= 0),
  updated_at timestamptz not null default now(),
  constraint truth_or_dare_prompt_consistency check (
    (current_prompt_id is null and current_prompt_kind is null and current_prompt_text is null)
    or (current_prompt_id is not null and current_prompt_kind is not null and current_prompt_text is not null)
  )
);

create index if not exists truth_or_dare_games_updated_idx
  on public.truth_or_dare_games(updated_at desc);
create index if not exists truth_or_dare_games_current_turn_idx on public.truth_or_dare_games(current_turn_user_id);
create index if not exists truth_or_dare_games_current_prompt_idx on public.truth_or_dare_games(current_prompt_id);
create index if not exists truth_or_dare_prompts_enabled_pick_idx on public.truth_or_dare_prompts(mode, kind) where enabled;

insert into public.truth_or_dare_prompts (id, mode, kind, prompt_text) values
  ('f-t1', 'friends', 'truth', 'What is the funniest misunderstanding you have ever had?'),
  ('f-t2', 'friends', 'truth', 'Which song do you secretly know every word to?'),
  ('f-t3', 'friends', 'truth', 'What is one harmless habit your friends always tease you about?'),
  ('f-t4', 'friends', 'truth', 'What was your most awkward first impression of someone here?'),
  ('f-t5', 'friends', 'truth', 'What small thing instantly improves your mood?'),
  ('f-d1', 'friends', 'dare', 'Give a dramatic 10-second movie-trailer voice-over for the person on your left.'),
  ('f-d2', 'friends', 'dare', 'Do your best robot dance for 15 seconds.'),
  ('f-d3', 'friends', 'dare', 'Describe your day using only three emojis, then explain them.'),
  ('f-d4', 'friends', 'dare', 'Speak like a news reporter until your next turn.'),
  ('f-d5', 'friends', 'dare', 'Make up a two-line friendship anthem on the spot.'),
  ('c-t1', 'couples', 'truth', 'What was the first little thing you noticed about your partner?'),
  ('c-t2', 'couples', 'truth', 'What is one memory together that always makes you smile?'),
  ('c-t3', 'couples', 'truth', 'What simple date would make you happiest right now?'),
  ('c-t4', 'couples', 'truth', 'What is one thing your partner does that makes you feel appreciated?'),
  ('c-t5', 'couples', 'truth', 'Which song would you pick as the soundtrack to a favourite memory together?'),
  ('c-d1', 'couples', 'dare', 'Give your partner a sincere compliment you have not said today.'),
  ('c-d2', 'couples', 'dare', 'Plan a dream date in 30 seconds using only three details.'),
  ('c-d3', 'couples', 'dare', 'Draw a tiny portrait of your partner in 20 seconds.'),
  ('c-d4', 'couples', 'dare', 'Recreate how you think your partner looks when excited.'),
  ('c-d5', 'couples', 'dare', 'Say one thing you appreciate about the way your partner thinks.')
on conflict (id) do nothing;

alter table public.truth_or_dare_prompts enable row level security;
alter table public.truth_or_dare_games enable row level security;
drop policy if exists "clients cannot read prompt catalog directly" on public.truth_or_dare_prompts;
create policy "clients cannot read prompt catalog directly"
  on public.truth_or_dare_prompts for select to authenticated
  using (false);
revoke all on public.truth_or_dare_prompts from public, anon, authenticated;
revoke all on public.truth_or_dare_games from public, anon, authenticated;
grant select on public.truth_or_dare_games to authenticated;

drop policy if exists "room members can read truth or dare state" on public.truth_or_dare_games;
create policy "room members can read truth or dare state"
  on public.truth_or_dare_games for select to authenticated
  using (public.is_room_member(room_id));

create or replace function public.start_truth_or_dare(p_room_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_room public.rooms%rowtype;
  v_state public.truth_or_dare_games%rowtype;
  v_order uuid[];
  v_mode text;
  v_current_index integer;
  v_current_user uuid;
  v_prompt_was_active boolean := false;
begin
  if v_user_id is null then
    raise exception 'Start a guest session and try again.' using errcode = '28000';
  end if;
  if not public.is_room_member(p_room_id) then
    raise exception 'You are not a member of this room.' using errcode = '42501';
  end if;

  select * into v_room from public.rooms r where r.id = p_room_id;
  if not found or v_room.game_id not in ('truth-dare-friends', 'couple-truth-dare') then
    raise exception 'This room is not a Truth or Dare room.' using errcode = '22023';
  end if;
  if v_room.status <> 'open' or v_room.expires_at <= now() then
    raise exception 'This room is closed or expired.' using errcode = '22023';
  end if;

  v_mode := case when v_room.game_id = 'couple-truth-dare' then 'couples' else 'friends' end;
  select coalesce(array_agg(rp.user_id order by rp.joined_at, rp.id), '{}'::uuid[])
    into v_order
    from public.room_players rp
    where rp.room_id = p_room_id;
  if cardinality(v_order) = 0 then
    raise exception 'Join this room before starting the game.' using errcode = '22023';
  end if;

  insert into public.truth_or_dare_games(room_id, mode, player_order, current_turn_index, current_turn_user_id)
  values (p_room_id, v_mode, v_order, 0, v_order[1])
  on conflict (room_id) do nothing;

  select * into v_state from public.truth_or_dare_games g where g.room_id = p_room_id for update;
  if v_state.mode <> v_mode then
    raise exception 'Room mode does not match the saved game.' using errcode = '22023';
  end if;

  -- Keep a stable current turn when players join. If the active player leaves, clear their prompt and advance to a valid seat.
  if v_state.player_order is distinct from v_order then
    v_prompt_was_active := v_state.current_prompt_id is not null;
    if v_state.current_turn_user_id is not null and v_state.current_turn_user_id = any(v_order) then
      v_current_index := array_position(v_order, v_state.current_turn_user_id) - 1;
      v_current_user := v_state.current_turn_user_id;
    else
      v_current_index := greatest(coalesce(v_state.current_turn_index, 0), 0) % cardinality(v_order);
      v_current_user := v_order[v_current_index + 1];
    end if;

    update public.truth_or_dare_games
    set player_order = v_order,
        current_turn_index = v_current_index,
        current_turn_user_id = v_current_user,
        current_prompt_id = case when v_prompt_was_active and not coalesce(v_state.current_turn_user_id = any(v_order), false) then null else current_prompt_id end,
        current_prompt_kind = case when v_prompt_was_active and not coalesce(v_state.current_turn_user_id = any(v_order), false) then null else current_prompt_kind end,
        current_prompt_text = case when v_prompt_was_active and not coalesce(v_state.current_turn_user_id = any(v_order), false) then null else current_prompt_text end,
        skipped_count = skipped_count + case when v_prompt_was_active and not coalesce(v_state.current_turn_user_id = any(v_order), false) then 1 else 0 end,
        updated_at = now()
    where room_id = p_room_id
    returning * into v_state;
  end if;

  return to_jsonb(v_state);
end;
$$;

create or replace function public.choose_truth_or_dare(p_room_id uuid, p_kind text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_room public.rooms%rowtype;
  v_state public.truth_or_dare_games%rowtype;
  v_prompt public.truth_or_dare_prompts%rowtype;
  v_used text[];
begin
  if v_user_id is null then raise exception 'Start a guest session and try again.' using errcode = '28000'; end if;
  if p_kind is null or p_kind not in ('truth', 'dare') then raise exception 'Choose Truth or Dare.' using errcode = '22023'; end if;
  if not public.is_room_member(p_room_id) then raise exception 'You are not a member of this room.' using errcode = '42501'; end if;

  select * into v_room from public.rooms r where r.id = p_room_id;
  if not found or v_room.game_id not in ('truth-dare-friends', 'couple-truth-dare') or v_room.status <> 'open' or v_room.expires_at <= now() then
    raise exception 'This Truth or Dare room is not active.' using errcode = '22023';
  end if;
  select * into v_state from public.truth_or_dare_games g where g.room_id = p_room_id for update;
  if not found then raise exception 'Game state is not initialized. Refresh and try again.' using errcode = 'P0002'; end if;
  if cardinality(v_state.player_order) < 2 then raise exception 'Invite at least one more player to start.' using errcode = '22023'; end if;
  if v_state.current_turn_user_id <> v_user_id then raise exception 'It is another player''s turn.' using errcode = '42501'; end if;
  if v_state.current_prompt_id is not null then raise exception 'Finish or skip the current prompt first.' using errcode = '22023'; end if;

  v_used := coalesce(v_state.used_prompt_ids, '{}'::text[]);
  select * into v_prompt
    from public.truth_or_dare_prompts p
    where p.enabled and p.mode = v_state.mode and p.kind = p_kind
      and not (p.id = any(v_used))
    order by random()
    limit 1;
  if not found then
    -- Every prompt of this kind was used, so begin a fresh cycle.
    v_used := '{}'::text[];
    select * into v_prompt
      from public.truth_or_dare_prompts p
      where p.enabled and p.mode = v_state.mode and p.kind = p_kind
      order by random()
      limit 1;
  end if;
  if not found then raise exception 'No prompts are configured for this mode yet.' using errcode = 'P0002'; end if;

  if v_prompt.id = any(v_used) then v_used := array[v_prompt.id]; else v_used := array_append(v_used, v_prompt.id); end if;
  update public.truth_or_dare_games
  set current_prompt_id = v_prompt.id,
      current_prompt_kind = v_prompt.kind,
      current_prompt_text = v_prompt.prompt_text,
      used_prompt_ids = v_used,
      updated_at = now()
  where room_id = p_room_id
  returning * into v_state;
  return to_jsonb(v_state);
end;
$$;

create or replace function public.resolve_truth_or_dare(p_room_id uuid, p_skipped boolean default false)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_room public.rooms%rowtype;
  v_state public.truth_or_dare_games%rowtype;
  v_next_index integer;
  v_next_user uuid;
begin
  if v_user_id is null then raise exception 'Start a guest session and try again.' using errcode = '28000'; end if;
  if not public.is_room_member(p_room_id) then raise exception 'You are not a member of this room.' using errcode = '42501'; end if;
  select * into v_room from public.rooms r where r.id = p_room_id;
  if not found or v_room.game_id not in ('truth-dare-friends', 'couple-truth-dare') or v_room.status <> 'open' or v_room.expires_at <= now() then
    raise exception 'This Truth or Dare room is not active.' using errcode = '22023';
  end if;
  select * into v_state from public.truth_or_dare_games g where g.room_id = p_room_id for update;
  if not found then raise exception 'Game state was not found.' using errcode = 'P0002'; end if;
  if v_state.current_turn_user_id <> v_user_id then raise exception 'Only the current player can finish or skip this prompt.' using errcode = '42501'; end if;
  if v_state.current_prompt_id is null then raise exception 'Choose a prompt before finishing the turn.' using errcode = '22023'; end if;
  if cardinality(v_state.player_order) < 2 then raise exception 'The room needs at least two players.' using errcode = '22023'; end if;

  v_next_index := (v_state.current_turn_index + 1) % cardinality(v_state.player_order);
  v_next_user := v_state.player_order[v_next_index + 1];
  update public.truth_or_dare_games
  set current_turn_index = v_next_index,
      current_turn_user_id = v_next_user,
      current_prompt_id = null,
      current_prompt_kind = null,
      current_prompt_text = null,
      completed_count = completed_count + case when coalesce(p_skipped, false) then 0 else 1 end,
      skipped_count = skipped_count + case when coalesce(p_skipped, false) then 1 else 0 end,
      updated_at = now()
  where room_id = p_room_id
  returning * into v_state;
  return to_jsonb(v_state);
end;
$$;

revoke all on function public.start_truth_or_dare(uuid) from public, anon;
revoke all on function public.choose_truth_or_dare(uuid, text) from public, anon;
revoke all on function public.resolve_truth_or_dare(uuid, boolean) from public, anon;
grant execute on function public.start_truth_or_dare(uuid) to authenticated;
grant execute on function public.choose_truth_or_dare(uuid, text) to authenticated;
grant execute on function public.resolve_truth_or_dare(uuid, boolean) to authenticated;

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') and not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'truth_or_dare_games'
  ) then
    execute 'alter publication supabase_realtime add table public.truth_or_dare_games';
  end if;
end;
$$;

