-- Run manually in Supabase SQL Editor after applying Phase 05 migration.
-- Expected: both tables exist and RLS is true.
select n.nspname as schema_name, c.relname as table_name, c.relrowsecurity as rls_enabled
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in ('truth_or_dare_games', 'truth_or_dare_prompts')
order by c.relname;

-- Expected: truth_or_dare_games has room-member SELECT; prompt table has no browser policy.
select tablename, policyname, cmd, roles, qual
from pg_policies
where schemaname = 'public'
  and tablename in ('truth_or_dare_games', 'truth_or_dare_prompts')
order by tablename, policyname;

-- Expected: anon cannot execute; authenticated can execute the three room-validated RPCs.
select
  has_function_privilege('anon', 'public.start_truth_or_dare(uuid)', 'EXECUTE') as anon_can_start,
  has_function_privilege('authenticated', 'public.start_truth_or_dare(uuid)', 'EXECUTE') as authenticated_can_start,
  has_function_privilege('anon', 'public.choose_truth_or_dare(uuid,text)', 'EXECUTE') as anon_can_choose,
  has_function_privilege('authenticated', 'public.choose_truth_or_dare(uuid,text)', 'EXECUTE') as authenticated_can_choose,
  has_function_privilege('anon', 'public.resolve_truth_or_dare(uuid,boolean)', 'EXECUTE') as anon_can_resolve,
  has_function_privilege('authenticated', 'public.resolve_truth_or_dare(uuid,boolean)', 'EXECUTE') as authenticated_can_resolve;

-- Expected: truth_or_dare_games is in the Realtime publication.
select schemaname, tablename
from pg_publication_tables
where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'truth_or_dare_games';
