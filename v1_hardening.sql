-- YaarJam V1 hardening for a database that already has the Phase 02/03/05 schema.
-- Safe and idempotent: adds useful indexes and makes prompt catalog direct reads explicitly deny-all.
create index if not exists rooms_host_user_id_idx on public.rooms(host_user_id);
create index if not exists room_players_user_joined_idx on public.room_players(user_id, joined_at desc);
create index if not exists tic_tac_toe_games_x_user_id_idx on public.tic_tac_toe_games(x_user_id);
create index if not exists tic_tac_toe_games_o_user_id_idx on public.tic_tac_toe_games(o_user_id);
create index if not exists tic_tac_toe_games_current_turn_idx on public.tic_tac_toe_games(current_turn_user_id);
create index if not exists tic_tac_toe_games_winner_user_idx on public.tic_tac_toe_games(winner_user_id);
create index if not exists truth_or_dare_games_current_turn_idx on public.truth_or_dare_games(current_turn_user_id);
create index if not exists truth_or_dare_games_current_prompt_idx on public.truth_or_dare_games(current_prompt_id);
create index if not exists truth_or_dare_prompts_enabled_pick_idx on public.truth_or_dare_prompts(mode, kind) where enabled;
drop policy if exists "clients cannot read prompt catalog directly" on public.truth_or_dare_prompts;
create policy "clients cannot read prompt catalog directly"
  on public.truth_or_dare_prompts for select to authenticated using (false);


-- Prevent the client-facing room RPCs from creating/joining catalogue-only games.
-- V1 gameplay is limited to Tic Tac Toe and Friends/Couples Truth or Dare.
create or replace function public.create_room(
  p_room_name text, p_game_id text, p_display_name text, p_max_players integer default 10
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
  if v_user_id is null then raise exception 'Start a guest session and try again.' using errcode = '28000'; end if;
  if char_length(v_room_name) < 1 or char_length(v_room_name) > 36 then raise exception 'Room name must be 1–36 characters.' using errcode = '22023'; end if;
  if char_length(v_display_name) < 1 or char_length(v_display_name) > 18 then raise exception 'Player name must be 1–18 characters.' using errcode = '22023'; end if;
  if p_game_id is null or p_game_id not in ('truth-dare-friends', 'couple-truth-dare', 'tic-tac-toe') then
    raise exception 'That game is listed for a future update and cannot create a room in V1.' using errcode = '22023';
  end if;
  if v_max_players < 2 or v_max_players > 10 then raise exception 'Room size must be from 2 to 10 players.' using errcode = '22023'; end if;
  if p_game_id in ('couple-truth-dare', 'tic-tac-toe') and v_max_players <> 2 then raise exception 'This game supports exactly two players in V1.' using errcode = '22023'; end if;

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
      if v_try = 5 then raise exception 'Could not create a unique room code. Please try again.' using errcode = '23505'; end if;
    end;
  end loop;
  insert into public.room_players (room_id, user_id, display_name) values (v_room.id, v_user_id, v_display_name);
  update public.rooms set lobby_version = lobby_version + 1 where id = v_room.id returning * into v_room;
  return to_jsonb(v_room);
end;
$$;
revoke all on function public.create_room(text, text, text, integer) from public, anon;
grant execute on function public.create_room(text, text, text, integer) to authenticated;


-- Keep joining aligned with the V1 playable-game allowlist.
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
revoke all on function public.join_room(text, text) from public, anon;
grant execute on function public.join_room(text, text) to authenticated;
