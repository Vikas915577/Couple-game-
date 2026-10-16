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
