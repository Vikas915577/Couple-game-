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
