-- YaarJam V1.1 migration — run once in Supabase SQL Editor AFTER the existing V1 schema.
-- Adds room-member-only chat and selectable Truth or Dare prompt packs.
-- Never put a service-role/secret key in the browser.

-- ==================== ROOM CHAT ====================
create table if not exists public.room_messages (
  id bigint generated always as identity primary key,
  room_id uuid not null references public.rooms(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 18),
  body text not null check (char_length(body) between 1 and 500),
  created_at timestamptz not null default now()
);
create index if not exists room_messages_room_created_idx on public.room_messages(room_id, created_at desc);
alter table public.room_messages enable row level security;
drop policy if exists "room members can read room messages" on public.room_messages;
create policy "room members can read room messages"
  on public.room_messages for select to authenticated
  using (public.is_room_member(room_id));
revoke all on public.room_messages from public, anon, authenticated;
grant select on public.room_messages to authenticated;

create or replace function public.send_room_message(p_room_id uuid, p_body text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_body text := btrim(coalesce(p_body, ''));
  v_name text;
  v_room public.rooms%rowtype;
  v_message public.room_messages%rowtype;
  v_recent integer;
begin
  if v_user_id is null then raise exception 'Start a guest session first.' using errcode = '28000'; end if;
  if char_length(v_body) < 1 or char_length(v_body) > 500 then raise exception 'Message must be 1–500 characters.' using errcode = '22023'; end if;
  if not public.is_room_member(p_room_id) then raise exception 'Only room members can chat here.' using errcode = '42501'; end if;
  select * into v_room from public.rooms where id = p_room_id;
  if not found or v_room.status <> 'open' or v_room.expires_at <= now() then raise exception 'This room is closed or expired.' using errcode = '22023'; end if;
  select display_name into v_name from public.room_players where room_id = p_room_id and user_id = v_user_id;
  if v_name is null then raise exception 'Room membership was not found.' using errcode = '42501'; end if;
  select count(*) into v_recent from public.room_messages where room_id = p_room_id and user_id = v_user_id and created_at > now() - interval '10 seconds';
  if v_recent >= 6 then raise exception 'Slow down a little before sending another message.' using errcode = '54000'; end if;
  insert into public.room_messages(room_id, user_id, display_name, body)
  values (p_room_id, v_user_id, v_name, v_body)
  returning * into v_message;
  return to_jsonb(v_message);
end;
$$;
revoke all on function public.send_room_message(uuid, text) from public, anon;
grant execute on function public.send_room_message(uuid, text) to authenticated;

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') and not exists (
    select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'room_messages'
  ) then
    execute 'alter publication supabase_realtime add table public.room_messages';
  end if;
end;
$$;

-- ==================== PROMPT PACKS ====================
alter table public.truth_or_dare_prompts add column if not exists pack text not null default 'classic';
alter table public.truth_or_dare_prompts drop constraint if exists truth_or_dare_prompts_pack_check;
alter table public.truth_or_dare_prompts add constraint truth_or_dare_prompts_pack_check
  check (pack in ('classic', 'funny', 'romantic', 'flirty', 'spicy', 'after-dark'));
create index if not exists truth_or_dare_prompts_pack_pick_idx
  on public.truth_or_dare_prompts(mode, pack, kind) where enabled;

insert into public.truth_or_dare_prompts (id, mode, kind, prompt_text, enabled, pack) values
('v11-fun-t1','friends','truth','What is the most ridiculous thing you believed as a kid?',true,'funny'),
('v11-fun-t2','friends','truth','What is your most harmless but oddly specific ick?',true,'funny'),
('v11-fun-d1','friends','dare','Give a dramatic acceptance speech for winning an imaginary award.',true,'funny'),
('v11-fun-d2','friends','dare','Let the group choose a silly nickname for you for the next two rounds.',true,'funny'),
('v11-c-fun-t1','couples','truth','What harmless habit of yours always makes your partner smile?',true,'funny'),
('v11-c-fun-t2','couples','truth','What is the funniest misunderstanding you two have had?',true,'funny'),
('v11-c-fun-d1','couples','dare','Do a dramatic reenactment of how you first met or first chatted.',true,'funny'),
('v11-c-fun-d2','couples','dare','Invent a silly team name and a five-second team celebration.',true,'funny'),
('v11-c-rom-t1','couples','truth','What ordinary moment with your partner feels special to you?',true,'romantic'),
('v11-c-rom-t2','couples','truth','Which small thing your partner does makes you feel loved?',true,'romantic'),
('v11-c-rom-d1','couples','dare','Give your partner a 20-second appreciation speech with three specific details.',true,'romantic'),
('v11-c-rom-d2','couples','dare','Plan a mini date using only things already at home.',true,'romantic'),
('v11-f-flirt-t1','friends','truth','What kind of compliment makes you secretly blush?',true,'flirty'),
('v11-f-flirt-t2','friends','truth','What is your most charming first-impression move?',true,'flirty'),
('v11-f-flirt-d1','friends','dare','Deliver a cheesy movie-style pickup line with full confidence; anyone can pass.',true,'flirty'),
('v11-f-flirt-d2','friends','dare','Give someone a respectful, specific compliment they can choose to accept or pass.',true,'flirty'),
('v11-c-flirt-t1','couples','truth','Which look or outfit of your partner do you find especially attractive?',true,'flirty'),
('v11-c-flirt-t2','couples','truth','What kind of kiss or affectionate gesture makes you feel most connected? Keep it as general as you like.',true,'flirty'),
('v11-c-flirt-d1','couples','dare','Hold eye contact for 15 seconds, then share one thing you appreciate.',true,'flirty'),
('v11-c-flirt-d2','couples','dare','Whisper a sincere compliment your partner has not heard from you before.',true,'flirty'),
('v11-f-spicy-t1','friends','truth','What is a bold opinion you only share when you really trust the group?',true,'spicy'),
('v11-f-spicy-t2','friends','truth','Have you ever had a crush you never told anyone about? You can skip names.',true,'spicy'),
('v11-f-spicy-d1','friends','dare','Read your last harmless search query aloud, after checking it contains nothing private.',true,'spicy'),
('v11-f-spicy-d2','friends','dare','Tell the group a funny embarrassing story you are comfortable sharing.',true,'spicy'),
('v11-c-spicy-t1','couples','truth','What is something new and romantic you would like to try together, only if you both feel comfortable?',true,'spicy'),
('v11-c-spicy-t2','couples','truth','What makes you feel most desired and appreciated by your partner?',true,'spicy'),
('v11-c-spicy-d1','couples','dare','Offer a slow, affectionate hug and ask first; a wave or compliment is an equally valid alternative.',true,'spicy'),
('v11-c-spicy-d2','couples','dare','Choose a song that sets a romantic mood and explain why you picked it.',true,'spicy'),
('v11-c-dark-t1','couples','truth','What boundary helps you feel safe while exploring more playful romance together?',true,'after-dark'),
('v11-c-dark-t2','couples','truth','What is a flirty fantasy date-night scenario you would enjoy discussing together? No details are required.',true,'after-dark'),
('v11-c-dark-t3','couples','truth','What type of affectionate attention do you wish you asked for more often?',true,'after-dark'),
('v11-c-dark-d1','couples','dare','Ask your partner to choose: a compliment, a hand-hold, a cuddle, or pass. Accept their answer without persuasion.',true,'after-dark'),
('v11-c-dark-d2','couples','dare','Plan a three-step date-night mood: one song, one snack, and one thing that helps you both relax.',true,'after-dark'),
('v11-c-dark-d3','couples','dare','Share one thing you find attractive about your partner. Keep it at the level you both enjoy.',true,'after-dark')
on conflict (id) do update set mode = excluded.mode, kind = excluded.kind, prompt_text = excluded.prompt_text, enabled = excluded.enabled, pack = excluded.pack;

-- Replace the old two-argument picker with a pack-aware RPC. The frontend passes all 3 args.
drop function if exists public.choose_truth_or_dare(uuid, text);
create function public.choose_truth_or_dare(p_room_id uuid, p_kind text, p_pack text default 'classic')
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
  v_pack text := coalesce(p_pack, 'classic');
begin
  if v_user_id is null then raise exception 'Start a guest session and try again.' using errcode = '28000'; end if;
  if p_kind is null or p_kind not in ('truth', 'dare') then raise exception 'Choose Truth or Dare.' using errcode = '22023'; end if;
  if v_pack not in ('classic', 'funny', 'romantic', 'flirty', 'spicy', 'after-dark') then raise exception 'Unknown prompt pack.' using errcode = '22023'; end if;
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
  if v_pack in ('romantic', 'flirty', 'after-dark') and v_state.mode <> 'couples' then
    raise exception 'This pack is available in Couples mode only.' using errcode = '22023';
  end if;
  if v_pack = 'after-dark' and v_state.mode <> 'couples' then raise exception 'After Dark is only for couples.' using errcode = '22023'; end if;

  v_used := coalesce(v_state.used_prompt_ids, '{}'::text[]);
  select * into v_prompt from public.truth_or_dare_prompts p
    where p.enabled and p.mode = v_state.mode and p.kind = p_kind and p.pack = v_pack and not (p.id = any(v_used))
    order by random() limit 1;
  if not found then
    select * into v_prompt from public.truth_or_dare_prompts p
      where p.enabled and p.mode = v_state.mode and p.kind = p_kind and p.pack = v_pack
      order by random() limit 1;
    v_used := '{}'::text[];
  end if;
  if not found then raise exception 'No prompts available in this pack yet. Choose another pack.' using errcode = 'P0002'; end if;
  if v_prompt.id = any(v_used) then v_used := array[v_prompt.id]; else v_used := array_append(v_used, v_prompt.id); end if;
  update public.truth_or_dare_games set current_prompt_id = v_prompt.id, current_prompt_kind = v_prompt.kind,
    current_prompt_text = v_prompt.prompt_text, used_prompt_ids = v_used, updated_at = now()
    where room_id = p_room_id returning * into v_state;
  return to_jsonb(v_state);
end;
$$;
revoke all on function public.choose_truth_or_dare(uuid, text, text) from public, anon;
grant execute on function public.choose_truth_or_dare(uuid, text, text) to authenticated;

-- ==================== ONLINE LUDO ====================
-- Online Ludo is host-started after 2–4 people have joined. Dice and token moves are
-- generated/validated in SECURITY DEFINER RPCs; browsers cannot write game state.
create table if not exists public.ludo_games (
  room_id uuid primary key references public.rooms(id) on delete cascade,
  game_state jsonb not null,
  updated_at timestamptz not null default now()
);
create index if not exists ludo_games_updated_idx on public.ludo_games(updated_at desc);
alter table public.ludo_games enable row level security;
drop policy if exists "room members can read ludo state" on public.ludo_games;
create policy "room members can read ludo state" on public.ludo_games
  for select to authenticated using (public.is_room_member(room_id));
revoke all on public.ludo_games from public, anon, authenticated;
grant select on public.ludo_games to authenticated;

-- Update create_room to permit Ludo online while retaining V1 restrictions.
create or replace function public.create_room(
  p_room_name text, p_game_id text, p_display_name text, p_max_players integer default 10
)
returns jsonb language plpgsql security definer set search_path = '' as $$
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
  if p_game_id is null or p_game_id not in ('truth-dare-friends', 'couple-truth-dare', 'tic-tac-toe', 'ludo') then
    raise exception 'That game cannot create an online room in this release.' using errcode = '22023';
  end if;
  if v_max_players < 2 or v_max_players > 10 then raise exception 'Room size must be from 2 to 10 players.' using errcode = '22023'; end if;
  if p_game_id in ('couple-truth-dare', 'tic-tac-toe') and v_max_players <> 2 then raise exception 'This game supports exactly two players.' using errcode = '22023'; end if;
  if p_game_id = 'ludo' and v_max_players not between 2 and 4 then raise exception 'Online Ludo supports 2–4 players.' using errcode = '22023'; end if;
  for v_try in 1..5 loop
    v_code := '';
    for v_i in 1..8 loop v_code := v_code || substr(v_alphabet, floor(random() * char_length(v_alphabet))::integer + 1, 1); end loop;
    begin
      insert into public.rooms (code, room_name, game_id, host_user_id, max_players)
      values (v_code, v_room_name, p_game_id, v_user_id, v_max_players) returning * into v_room;
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

create or replace function public.join_room(p_code text, p_display_name text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_user_id uuid := (select auth.uid());
  v_code text := upper(btrim(coalesce(p_code, '')));
  v_display_name text := btrim(coalesce(p_display_name, ''));
  v_room public.rooms%rowtype;
  v_count integer;
begin
  if v_user_id is null then raise exception 'Start a guest session and try again.' using errcode = '28000'; end if;
  if v_code !~ '^[A-Z0-9]{6,8}$' then raise exception 'Enter a valid 6–8 character room code.' using errcode = '22023'; end if;
  if char_length(v_display_name) < 1 or char_length(v_display_name) > 18 then raise exception 'Player name must be 1–18 characters.' using errcode = '22023'; end if;
  select * into v_room from public.rooms r where r.code = v_code for update;
  if not found or v_room.status <> 'open' or v_room.expires_at <= now() then raise exception 'Room not found, closed, or expired. Check the code with your friend.' using errcode = 'P0002'; end if;
  if v_room.game_id not in ('truth-dare-friends', 'couple-truth-dare', 'tic-tac-toe', 'ludo') then raise exception 'This game is not enabled for online rooms.' using errcode = '22023'; end if;
  if exists (select 1 from public.room_players rp where rp.room_id = v_room.id and rp.user_id = v_user_id) then return to_jsonb(v_room); end if;
  if v_room.game_id = 'ludo' and exists (select 1 from public.ludo_games lg where lg.room_id = v_room.id) then raise exception 'This Ludo match has already started. Ask the host for a new room.' using errcode = '54000'; end if;
  select count(*) into v_count from public.room_players rp where rp.room_id = v_room.id;
  if v_count >= v_room.max_players then raise exception 'This room is full.' using errcode = '54000'; end if;
  if exists (select 1 from public.room_players rp where rp.room_id = v_room.id and lower(rp.display_name) = lower(v_display_name)) then raise exception 'That display name is already used in this room. Try another.' using errcode = '23505'; end if;
  insert into public.room_players (room_id, user_id, display_name) values (v_room.id, v_user_id, v_display_name);
  update public.rooms set lobby_version = lobby_version + 1 where id = v_room.id returning * into v_room;
  return to_jsonb(v_room);
end;
$$;
revoke all on function public.join_room(text, text) from public, anon;
grant execute on function public.join_room(text, text) to authenticated;

create or replace function public.start_ludo(p_room_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_user_id uuid := (select auth.uid());
  v_room public.rooms%rowtype;
  v_existing public.ludo_games%rowtype;
  v_players jsonb;
  v_state jsonb;
  v_count integer;
begin
  if v_user_id is null then raise exception 'Start a guest session first.' using errcode = '28000'; end if;
  select * into v_room from public.rooms r where r.id = p_room_id for update;
  if not found or v_room.game_id <> 'ludo' or v_room.status <> 'open' or v_room.expires_at <= now() then raise exception 'This Ludo room is not active.' using errcode = '22023'; end if;
  if v_room.host_user_id <> v_user_id then raise exception 'Only the room host can start Ludo.' using errcode = '42501'; end if;
  select * into v_existing from public.ludo_games where room_id = p_room_id for update;
  if found then return v_existing.game_state; end if;
  select count(*) into v_count from public.room_players where room_id = p_room_id;
  if v_count < 2 or v_count > 4 then raise exception 'Ludo needs 2–4 players before it can start.' using errcode = '22023'; end if;
  select jsonb_agg(jsonb_build_object(
    'id', player.user_id::text,
    'name', player.display_name,
    'color', case player.slot when 0 then 'red' when 1 then 'blue' when 2 then 'green' else 'yellow' end,
    'isComputer', false,
    'tokens', jsonb_build_array(-1, -1, -1, -1)
  ) order by player.joined_at, player.id) into v_players
  from (select rp.*, (row_number() over (order by rp.joined_at, rp.id) - 1)::integer as slot from public.room_players rp where rp.room_id = p_room_id) player;
  v_state := jsonb_build_object('players', v_players, 'currentPlayerIndex', 0, 'die', null, 'rolled', false,
    'legalTokenIndices', '[]'::jsonb, 'winnerId', null, 'message', 'Ludo is ready. First player, roll the die.', 'turnNumber', 1);
  insert into public.ludo_games(room_id, game_state) values (p_room_id, v_state);
  return v_state;
end;
$$;

create or replace function public.reset_ludo(p_room_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_user_id uuid := (select auth.uid());
  v_room public.rooms%rowtype;
begin
  select * into v_room from public.rooms where id = p_room_id for update;
  if not found or v_room.game_id <> 'ludo' then raise exception 'Ludo room not found.' using errcode = 'P0002'; end if;
  if v_room.host_user_id <> v_user_id then raise exception 'Only the host can reset Ludo.' using errcode = '42501'; end if;
  delete from public.ludo_games where room_id = p_room_id;
  return public.start_ludo(p_room_id);
end;
$$;

create or replace function public.play_ludo_action(p_room_id uuid, p_action text, p_token_index integer default null)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_user_id uuid := (select auth.uid());
  v_room public.rooms%rowtype;
  v_state jsonb;
  v_players jsonb;
  v_player jsonb;
  v_tokens jsonb;
  v_idx integer;
  v_next_idx integer;
  v_token integer;
  v_progress integer;
  v_next_progress integer;
  v_die integer;
  v_legal jsonb := '[]'::jsonb;
  v_legal_count integer := 0;
  v_color text;
  v_offset integer;
  v_landing integer;
  v_opp_idx integer;
  v_opp jsonb;
  v_opp_tokens jsonb;
  v_opp_token integer;
  v_opp_progress integer;
  v_opp_color text;
  v_opp_offset integer;
  v_captured boolean := false;
  v_winner_id text;
  v_bonus boolean;
  v_message text;
begin
  if v_user_id is null then raise exception 'Start a guest session first.' using errcode = '28000'; end if;
  select * into v_room from public.rooms where id = p_room_id;
  if not found or v_room.game_id <> 'ludo' or v_room.status <> 'open' or v_room.expires_at <= now() then raise exception 'This Ludo room is not active.' using errcode = '22023'; end if;
  if not public.is_room_member(p_room_id) then raise exception 'Only room members can play this match.' using errcode = '42501'; end if;
  select game_state into v_state from public.ludo_games where room_id = p_room_id for update;
  if not found then raise exception 'The host must start Ludo first.' using errcode = 'P0002'; end if;
  if (v_state->>'winnerId') is not null then raise exception 'This Ludo match has ended. Ask the host to reset it.' using errcode = '22023'; end if;
  v_players := v_state->'players';
  v_idx := (v_state->>'currentPlayerIndex')::integer;
  v_player := v_players->v_idx;
  if v_player->>'id' <> v_user_id::text then raise exception 'It is not your turn.' using errcode = '42501'; end if;
  if p_action = 'roll' then
    if coalesce((v_state->>'rolled')::boolean, false) then raise exception 'Move a token before rolling again.' using errcode = '22023'; end if;
    v_die := floor(random() * 6)::integer + 1;
    v_tokens := v_player->'tokens';
    for v_token in 0..3 loop
      v_progress := (v_tokens->>v_token)::integer;
      if v_progress = -1 and v_die = 6 then
        v_legal := v_legal || to_jsonb(v_token); v_legal_count := v_legal_count + 1;
      elsif v_progress >= 0 and v_progress < 58 and v_progress + v_die <= 58 then
        v_legal := v_legal || to_jsonb(v_token); v_legal_count := v_legal_count + 1;
      end if;
    end loop;
    if v_legal_count = 0 and v_die <> 6 then
      v_next_idx := (v_idx + 1) % jsonb_array_length(v_players);
      v_state := jsonb_set(v_state, '{currentPlayerIndex}', to_jsonb(v_next_idx), true);
      v_state := jsonb_set(v_state, '{turnNumber}', to_jsonb((v_state->>'turnNumber')::integer + 1), true);
      v_state := jsonb_set(v_state, '{die}', 'null'::jsonb, true);
      v_state := jsonb_set(v_state, '{rolled}', 'false'::jsonb, true);
      v_state := jsonb_set(v_state, '{legalTokenIndices}', '[]'::jsonb, true);
      v_next_idx := (v_state->>'currentPlayerIndex')::integer;
      v_message := (v_player->>'name') || ' rolled ' || v_die || ' with no legal move. ' || (v_players->v_next_idx->>'name') || '''s turn.';
    elsif v_legal_count = 0 and v_die = 6 then
      v_state := jsonb_set(v_state, '{die}', to_jsonb(v_die), true);
      v_state := jsonb_set(v_state, '{rolled}', 'false'::jsonb, true);
      v_state := jsonb_set(v_state, '{legalTokenIndices}', '[]'::jsonb, true);
      v_message := (v_player->>'name') || ' rolled 6 but has no legal move. Roll again.';
    else
      v_state := jsonb_set(v_state, '{die}', to_jsonb(v_die), true);
      v_state := jsonb_set(v_state, '{rolled}', 'true'::jsonb, true);
      v_state := jsonb_set(v_state, '{legalTokenIndices}', v_legal, true);
      v_message := (v_player->>'name') || ' rolled ' || v_die || '. Choose a token.';
    end if;
    v_state := jsonb_set(v_state, '{message}', to_jsonb(v_message), true);
  elsif p_action = 'move' then
    if not coalesce((v_state->>'rolled')::boolean, false) then raise exception 'Roll the die first.' using errcode = '22023'; end if;
    if p_token_index is null or p_token_index < 0 or p_token_index > 3 or not (v_state->'legalTokenIndices' @> to_jsonb(p_token_index)) then raise exception 'That token cannot move with this roll.' using errcode = '22023'; end if;
    v_die := (v_state->>'die')::integer;
    v_tokens := v_player->'tokens';
    v_progress := (v_tokens->>p_token_index)::integer;
    if v_progress = 58 then raise exception 'That token has already reached home.' using errcode = '22023'; end if;
    if v_progress = -1 then
      if v_die <> 6 then raise exception 'Roll a six to leave the yard.' using errcode = '22023'; end if;
      v_next_progress := 0;
    else
      v_next_progress := v_progress + v_die;
      if v_next_progress > 58 then raise exception 'You need an exact roll to reach home.' using errcode = '22023'; end if;
    end if;
    v_tokens := jsonb_set(v_tokens, array[p_token_index::text], to_jsonb(v_next_progress), true);
    v_player := jsonb_set(v_player, '{tokens}', v_tokens, true);
    v_players := jsonb_set(v_players, array[v_idx::text], v_player, true);
    v_color := v_player->>'color';
    v_offset := case v_color when 'red' then 0 when 'blue' then 13 when 'green' then 26 else 39 end;
    if v_next_progress between 0 and 51 then
      v_landing := (v_offset + v_next_progress) % 52;
      if not (v_landing = any(array[0,8,13,21,26,34,39,47])) then
        for v_opp_idx in 0..jsonb_array_length(v_players)-1 loop
          if v_opp_idx <> v_idx then
            v_opp := v_players->v_opp_idx;
            v_opp_tokens := v_opp->'tokens';
            v_opp_color := v_opp->>'color';
            v_opp_offset := case v_opp_color when 'red' then 0 when 'blue' then 13 when 'green' then 26 else 39 end;
            for v_opp_token in 0..3 loop
              v_opp_progress := (v_opp_tokens->>v_opp_token)::integer;
              if v_opp_progress between 0 and 51 and ((v_opp_offset + v_opp_progress) % 52) = v_landing then
                v_opp_tokens := jsonb_set(v_opp_tokens, array[v_opp_token::text], to_jsonb(-1), true);
                v_captured := true;
              end if;
            end loop;
            v_opp := jsonb_set(v_opp, '{tokens}', v_opp_tokens, true);
            v_players := jsonb_set(v_players, array[v_opp_idx::text], v_opp, true);
          end if;
        end loop;
      end if;
    end if;
    v_tokens := (v_players->v_idx)->'tokens';
    if not exists (select 1 from jsonb_array_elements_text(v_tokens) as token(value) where token.value::integer <> 58) then v_winner_id := (v_players->v_idx->>'id'); else v_winner_id := null; end if;
    v_bonus := v_die = 6 or v_captured;
    if v_winner_id is not null or v_bonus then v_next_idx := v_idx; else v_next_idx := (v_idx + 1) % jsonb_array_length(v_players); end if;
    v_state := jsonb_set(v_state, '{players}', v_players, true);
    v_state := jsonb_set(v_state, '{currentPlayerIndex}', to_jsonb(v_next_idx), true);
    v_state := jsonb_set(v_state, '{die}', 'null'::jsonb, true);
    v_state := jsonb_set(v_state, '{rolled}', 'false'::jsonb, true);
    v_state := jsonb_set(v_state, '{legalTokenIndices}', '[]'::jsonb, true);
    v_state := jsonb_set(v_state, '{winnerId}', coalesce(to_jsonb(v_winner_id), 'null'::jsonb), true);
    if v_winner_id is not null then
      v_message := (v_player->>'name') || ' gets all four tokens home and wins!';
    elsif v_bonus then
      v_message := (v_player->>'name') || ' moved token ' || (p_token_index + 1) || case when v_captured then ' and captured an opponent!' else '.' end || ' Bonus turn!';
    else
      v_message := (v_player->>'name') || ' moved token ' || (p_token_index + 1) || case when v_captured then ' and captured an opponent!' else '.' end || ' ' || (v_players->v_next_idx->>'name') || '''s turn.';
    end if;
    v_state := jsonb_set(v_state, '{message}', to_jsonb(v_message), true);
    v_state := jsonb_set(v_state, '{turnNumber}', to_jsonb((v_state->>'turnNumber')::integer + case when v_next_idx <> v_idx then 1 else 0 end), true);
  else
    raise exception 'Unknown Ludo action.' using errcode = '22023';
  end if;
  update public.ludo_games set game_state = v_state, updated_at = now() where room_id = p_room_id;
  return v_state;
end;
$$;

revoke all on function public.start_ludo(uuid) from public, anon;
revoke all on function public.reset_ludo(uuid) from public, anon;
revoke all on function public.play_ludo_action(uuid, text, integer) from public, anon;
grant execute on function public.start_ludo(uuid) to authenticated;
grant execute on function public.reset_ludo(uuid) to authenticated;
grant execute on function public.play_ludo_action(uuid, text, integer) to authenticated;

do $$ begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') and not exists (
    select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'ludo_games'
  ) then execute 'alter publication supabase_realtime add table public.ludo_games'; end if;
end; $$;


-- Extra prompt variety for the mature couple packs and friends' spicy-but-non-explicit pack.
insert into public.truth_or_dare_prompts (id, mode, kind, prompt_text, enabled, pack) values
('v11-c-flirt-t3','couples','truth','What look from your partner can distract you instantly?',true,'flirty'),
('v11-c-flirt-t4','couples','truth','What compliment would you love to hear more often?',true,'flirty'),
('v11-c-flirt-d3','couples','dare','Give your partner a playful movie-style pickup line; let them rate the delivery.',true,'flirty'),
('v11-c-flirt-d4','couples','dare','Choose one: a cheeky compliment, a 10-second dance, or a pass.',true,'flirty'),
('v11-c-spicy-t3','couples','truth','What kind of flirting makes you feel most wanted without feeling pressured?',true,'spicy'),
('v11-c-spicy-t4','couples','truth','What is one romantic thing you would like your partner to initiate more often?',true,'spicy'),
('v11-c-spicy-d3','couples','dare','Give your partner a slow, fully-clothed 15-second dance, or choose a compliment instead.',true,'spicy'),
('v11-c-spicy-d4','couples','dare','Tell your partner one thing you find irresistibly attractive, keeping details at your shared comfort level.',true,'spicy'),
('v11-c-dark-t4','couples','truth','What kind of teasing feels fun to you, and what crosses a boundary?',true,'after-dark'),
('v11-c-dark-t5','couples','truth','Which romantic moment would you love to replay with your partner?',true,'after-dark'),
('v11-c-dark-t6','couples','truth','What makes a private, romantic moment feel exciting and safe at the same time?',true,'after-dark'),
('v11-c-dark-d4','couples','dare','Let your partner choose a 20-second slow dance, a forehead kiss, a hug, or pass; accept their choice without pressure.',true,'after-dark'),
('v11-c-dark-d5','couples','dare','Whisper a bold but respectful compliment and let your partner decide whether to return one.',true,'after-dark'),
('v11-c-dark-d6','couples','dare','Take turns naming one thing you would like more of in date night: affection, attention, laughter, or conversation.',true,'after-dark'),
('v11-f-spicy-t3','friends','truth','What is the boldest harmless thing you have done to impress a crush?',true,'spicy'),
('v11-f-spicy-t4','friends','truth','What flirting style do you think you have: smooth, shy, funny, or chaotic?',true,'spicy'),
('v11-f-spicy-d3','friends','dare','Read a fictional pickup line in the most dramatic voice you can; anyone can pass.',true,'spicy'),
('v11-f-spicy-d4','friends','dare','Give yourself a playful dating-show introduction in ten seconds.',true,'spicy')
on conflict (id) do update set mode = excluded.mode, kind = excluded.kind, prompt_text = excluded.prompt_text, enabled = excluded.enabled, pack = excluded.pack;
