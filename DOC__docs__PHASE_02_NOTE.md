> Historical phase handoff. This note describes the state at that phase and is superseded by the current root-level `CURRENT_STATUS.md` and `PROJECT_MASTER.md` (V1.0.0).

# Copy-paste handoff — YaarJam Phase 02

**PROJECT:** YaarJam  
**VERSION:** 0.2.0  
**CURRENT PHASE:** Phase 02 — room lobby/backend foundation

- Frontend: React + TypeScript + Vite; GitHub Pages workflow included.
- Backend: Supabase client through `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
- Added: anonymous guest sessions, room create/join/leave RPCs, member-only RLS reads, realtime player list, invite code/link, host handoff, empty-room close, demo fallback.
- SQL: apply `supabase/schema.sql` in Supabase SQL Editor and enable Anonymous Sign-Ins.
- GitHub: add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as repository Actions secrets; set Pages source to GitHub Actions.
- Not done: playable game rounds, chat, permanent accounts and abuse/rate limiting.
- QA caveat: source syntax, CSS, YAML/JSON, 9 catalogue smoke assertions and a supplemental dependency-stub internal typecheck passed. npm registry DNS failed during authoring, so the full dependency-backed build/Vitest run, SQL execution and two-device live test remain unverified. GitHub Actions workflow will run tests/build when pushed.
- Next: user uploads ZIP, configures Supabase, confirms Actions passes and tests one room from two devices; then proceed to Phase 03 game loop (start with Truth or Dare and Tic Tac Toe).
