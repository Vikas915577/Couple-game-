# YaarJam — Project Master Specification

**Version:** 1.0.0
**Updated:** 15 October 2026
**Status:** Finalized V1 source package; Supabase schema is applied to the dedicated YaarJam project. GitHub Pages build and two-device QA remain release gates.
**Brand:** YaarJam — “Apne log. Apna game.” (working name; domain/trademark not cleared)

## V1 goal
A free-first, mobile-first multiplayer website where friends and couples can create a private room from a phone browser and play supported games without installing an app.

## What really works in V1
1. Mobile-first home, game catalogue, search, Friends/Couples/Board categories and room UI.
2. Supabase guest session + room create/join/leave, invite code/link, member list and realtime lobby (requires Anonymous Sign-Ins enabled in the Supabase dashboard).
3. Tic Tac Toe: local demo and server-validated online moves, win/draw, reconnect refresh and two-player rematch.
4. Truth or Dare: Friends and Couples prompt sets, shared server-picked prompt, turn checks, Done/Skip and counters.

## Catalogue only — not playable yet
Ludo, Chess, Would You Rather, How Well Do You Know Me?, This or That, Never Have I Ever, Most Likely To, Our Story Quiz and Guess the Word are roadmap cards only. The app now labels these “PLANNED” and prevents creating rooms for them.

## Technical architecture
- Frontend: React + TypeScript + Vite.
- Hosting: GitHub Pages via `.github/workflows/deploy.yml`.
- Backend: Supabase Auth anonymous guest sessions, Postgres RPCs, RLS and Realtime Postgres Changes.
- Public client config: V1 has the dedicated project URL and publishable key as browser-safe defaults; never use a service-role/secret key in frontend code.
- SQL source of truth: `supabase/schema.sql`; `supabase/v1_hardening.sql` is idempotent for an already-set-up YaarJam database.

## Database and safety decisions
- The active YaarJam project is `gvwmisqnepdlejhvacbm` (“Vikas915577’s Project”). The separate “Winter arc” project was not modified.
- All five game/lobby tables have RLS enabled. Browser write privileges are revoked; state changes go through authenticated RPCs that check identity, room membership, current turn/status and pin `search_path`.
- Realtime is registered for rooms, room players, Tic Tac Toe state and Truth or Dare state.
- Prompt catalogue is read only inside server-side RPCs; direct client reads are denied.
- Anonymous Sign-Ins must be enabled before online guests can use rooms.

## Strict development rules
1. No new features until CI, database and two-phone testing are green.
2. Never claim the Vite production build is passed until CI or a real local dependency-backed build passes.
3. Test valid and invalid states, room membership, turn order, leave/rejoin, refresh/reconnect and rematch.
4. Keep the Supabase service-role key out of Vite variables, GitHub source and browsers.
5. Keep the separate Winter Arc project unchanged.
6. Keep `CURRENT_STATUS.md`, `BUGS.md`, `CHANGELOG.md` and `TEST_PLAN.md` up to date.

## Current release gates
- Enable Anonymous Sign-Ins in the linked Supabase project dashboard.
- Upload this folder's contents to a new GitHub repository; verify Actions completes `npm test`, `npm run build`, and Pages deployment.
- On two different phones/browsers, verify create/join room, player list sync, Tic Tac Toe win/rematch, Truth or Dare prompt/turn/skip, refresh/reconnect, and leave/host transfer.
- Fix any failing check before starting Ludo/Chess or adding more question games.

## Release caveats
- npm registry DNS (`EAI_AGAIN`) was unavailable in this authoring environment, so the full Vitest suite and dependency-backed Vite build could not be run here. The GitHub Actions workflow is configured to run them, but no CI result or live two-device result exists yet.
- Supabase advisors still report intentional `SECURITY DEFINER` RPC warnings because authenticated clients must call the validated functions. They are restricted from `PUBLIC`/`anon`, pin `search_path`, and validate caller state; re-review before a public-scale release.
- Free tiers have provider quotas/limits; do not treat “free” as unlimited.
