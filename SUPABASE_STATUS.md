# Supabase Live Setup Status — YaarJam V1

**Project ref:** `gvwmisqnepdlejhvacbm` (**Vikas915577's Project**)  
**State:** Database schema applied and metadata/permissions verified; Anonymous Sign-Ins setting still requires dashboard action; browser two-device test pending.

## Applied database migrations
- `yaarjam_v1_initial_schema` — full room, Tic Tac Toe and Truth or Dare schema plus prompt seed.
- `yaarjam_v1_release_scope_hardening` — idempotent indexes/policy and server-side V1-only game allowlist/player limits.

## Verified through the connected Supabase tools
- `public.rooms`, `public.room_players`, `public.tic_tac_toe_games`, `public.truth_or_dare_prompts`, `public.truth_or_dare_games` are present.
- All five tables have Row Level Security enabled.
- Four live state/lobby tables are in the `supabase_realtime` publication: rooms, room_players, tic_tac_toe_games, truth_or_dare_games.
- 20 enabled Truth or Dare prompts are seeded.
- `anon` cannot execute `create_room` or `start_truth_or_dare`; `authenticated` can call the intended RPC endpoints.
- Nine V1 hardening indexes are present; all 10 SECURITY DEFINER functions have an empty pinned search_path.
- Server-side room create/join allow only the 3 genuinely playable V1 modes; couples/Tic Tac Toe room capacity is enforced at 2.
- Authenticated clients cannot insert/update room data directly; all state changes go through checked RPCs.
- Explicit false SELECT policy is set on the prompt catalog in addition to revoking direct table grants.

## One remaining dashboard action
Enable Anonymous Sign-Ins here: https://supabase.com/dashboard/project/gvwmisqnepdlejhvacbm/auth/providers

I could not toggle this setting through the currently available Supabase connector. Do not confuse the Supabase `anon` API key with Anonymous Sign-Ins; guest sessions require the Auth setting to be enabled.

## Security advisor notes
The V1 verification SQL was run successfully and returned 5 tables / 5 RLS-enabled tables / 4 Realtime tables / 20 enabled prompts. The Supabase advisor shows 10 `SECURITY DEFINER` RPC warnings. These endpoints are intentional for atomic room/game moves; direct execution from `PUBLIC` and `anon` is revoked, and the functions enforce authenticated identity and room/turn checks. Review the advisor again before public launch. The performance advisor lists unused indexes because this new database has no room/game traffic yet.
