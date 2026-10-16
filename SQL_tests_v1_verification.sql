-- Run in Supabase SQL Editor for the YaarJam V1 project.
-- One row is returned; the DO block raises an exception if a release-critical check fails.
do $$
declare
  v_tables integer;
  v_rls integer;
  v_realtime integer;
  v_prompts integer;
  v_indexes integer;
  v_definer_search_path integer;
  v_public_anon_rpcs integer;
begin
  select count(*) into v_tables
  from information_schema.tables
  where table_schema='public' and table_name in ('rooms','room_players','tic_tac_toe_games','truth_or_dare_prompts','truth_or_dare_games');
  if v_tables <> 5 then raise exception 'Expected 5 YaarJam tables, found %', v_tables; end if;

  select count(*) into v_rls
  from pg_class c join pg_namespace n on n.oid=c.relnamespace
  where n.nspname='public' and c.relname in ('rooms','room_players','tic_tac_toe_games','truth_or_dare_prompts','truth_or_dare_games') and c.relrowsecurity;
  if v_rls <> 5 then raise exception 'RLS must be enabled on all 5 YaarJam tables; found %', v_rls; end if;

  select count(*) into v_realtime
  from pg_publication_tables
  where pubname='supabase_realtime' and schemaname='public' and tablename in ('rooms','room_players','tic_tac_toe_games','truth_or_dare_games');
  if v_realtime <> 4 then raise exception 'Expected 4 realtime tables, found %', v_realtime; end if;

  select count(*) into v_prompts from public.truth_or_dare_prompts where enabled;
  if v_prompts < 20 then raise exception 'Expected at least 20 enabled prompts, found %', v_prompts; end if;

  if has_function_privilege('anon','public.create_room(text,text,text,integer)','EXECUTE') then raise exception 'anon must not execute create_room'; end if;
  if not has_function_privilege('authenticated','public.create_room(text,text,text,integer)','EXECUTE') then raise exception 'authenticated must execute create_room'; end if;
  if has_function_privilege('anon','public.start_truth_or_dare(uuid)','EXECUTE') then raise exception 'anon must not execute start_truth_or_dare'; end if;
  if not has_function_privilege('authenticated','public.start_truth_or_dare(uuid)','EXECUTE') then raise exception 'authenticated must execute start_truth_or_dare'; end if;

  if position('would-you-rather' in pg_get_functiondef('public.create_room(text,text,text,integer)'::regprocedure)) > 0 then
    raise exception 'create_room must not allow catalogue-only games in V1';
  end if;
  if position('This game supports exactly two players in V1.' in pg_get_functiondef('public.create_room(text,text,text,integer)'::regprocedure)) = 0 then
    raise exception 'create_room must enforce two-player game limits server-side';
  end if;
  if position('This game is not playable in V1 yet.' in pg_get_functiondef('public.join_room(text,text)'::regprocedure)) = 0 then
    raise exception 'join_room must reject catalogue-only games in V1';
  end if;

  select count(*) into v_indexes from pg_indexes where schemaname='public' and indexname in (
    'rooms_host_user_id_idx','room_players_user_joined_idx','tic_tac_toe_games_x_user_id_idx',
    'tic_tac_toe_games_o_user_id_idx','tic_tac_toe_games_current_turn_idx','tic_tac_toe_games_winner_user_idx',
    'truth_or_dare_games_current_turn_idx','truth_or_dare_games_current_prompt_idx','truth_or_dare_prompts_enabled_pick_idx');
  if v_indexes <> 9 then raise exception 'Expected 9 V1 hardening indexes, found %', v_indexes; end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='truth_or_dare_prompts' and policyname='clients cannot read prompt catalog directly') then
    raise exception 'Expected deny-read prompt catalog policy';
  end if;

  select count(*) into v_definer_search_path
  from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public' and p.prosecdef
    and p.proname = any(array['create_room','join_room','leave_room','is_room_member','start_ttt_game','play_ttt_move','request_ttt_rematch','start_truth_or_dare','choose_truth_or_dare','resolve_truth_or_dare'])
    and p.proconfig @> array['search_path=""'];
  if v_definer_search_path <> 10 then raise exception 'Expected 10 SECURITY DEFINER functions with pinned empty search_path, found %', v_definer_search_path; end if;

  select count(*) into v_public_anon_rpcs
  from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public'
    and p.proname = any(array['create_room','join_room','leave_room','is_room_member','start_ttt_game','play_ttt_move','request_ttt_rematch','start_truth_or_dare','choose_truth_or_dare','resolve_truth_or_dare'])
    and has_function_privilege('anon', p.oid, 'EXECUTE');
  if v_public_anon_rpcs <> 0 then raise exception 'anon can execute % room/game functions', v_public_anon_rpcs; end if;

  if has_table_privilege('anon','public.rooms','SELECT') then raise exception 'anon must not read room records directly'; end if;
  if has_table_privilege('authenticated','public.rooms','INSERT') or has_table_privilege('authenticated','public.rooms','UPDATE') then
    raise exception 'Authenticated clients must not write room tables directly';
  end if;
end;
$$;

select
  (select count(*) from information_schema.tables where table_schema='public' and table_name in ('rooms','room_players','tic_tac_toe_games','truth_or_dare_prompts','truth_or_dare_games')) as yaarjam_tables,
  (select count(*) from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relname in ('rooms','room_players','tic_tac_toe_games','truth_or_dare_prompts','truth_or_dare_games') and c.relrowsecurity) as rls_enabled_tables,
  (select count(*) from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename in ('rooms','room_players','tic_tac_toe_games','truth_or_dare_games')) as realtime_tables,
  (select count(*) from public.truth_or_dare_prompts where enabled) as enabled_prompts;
