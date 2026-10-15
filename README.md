# YaarJam — Phase 03: first playable online game

**Tagline:** Apne log. Apna game.  
**Version:** `0.3.0`  
**State:** Tic Tac Toe gameplay source is implemented. Full dependency-backed build and live Supabase QA are still pending.

## What changed in Phase 03

- Tic Tac Toe is now playable locally in the browser's demo room (same-device pass-and-play only).
- Configured online rooms use Supabase RPCs for starting the game, accepting a move, deciding win/draw, and requesting a rematch.
- Server-side move validation checks room membership, whose turn it is, occupied cells, valid cell indices, finished games, and expired/closed rooms.
- A second player must join before an online round starts. Each player gets X or O, and the game state updates in realtime.
- Rematch requires both players to agree, and X/O roles switch on the next round.
- Added a responsive board, current-turn status, player labels, winning-cell highlight, rematch request state, and readable errors.
- Added the separate migration `supabase/phase_03_tic_tac_toe.sql`; also included it in the all-in-one `supabase/schema.sql` for fresh projects.
- Added 10 Vitest cases covering board rules, win/draw logic, invalid moves, rematch-related state mapping, and backend-board normalization. The suite is written but the Vitest runner could not execute here because dependencies could not be installed.

## What is still not implemented

Chess, Ludo, Truth or Dare, couple quizzes and other catalogue games remain not playable. User profiles, chat, rate limiting, production anti-abuse controls, broad browser testing and load testing remain future work. This phase is one game, not the full product.

## Run locally

Requirements: Node.js 22+ and npm.

```bash
npm install
npm test
npm run build
npm run dev
```

The current authoring environment timed out while contacting the npm registry, so no successful package-backed build is claimed here. GitHub Actions is configured to install dependencies, run Vitest and perform `npm run build` before deploying.

## Demo mode (no Supabase credentials)

1. Run `npm install` and `npm run dev`.
2. Open the local URL from Vite.
3. Create a Tic Tac Toe room and choose **Go to my rooms**.
4. The board is playable as same-device pass-and-play. It does **not** share moves with another device.

## Enable real online games using Supabase

### For a new Supabase project

1. Create a project at <https://supabase.com/dashboard>.
2. Enable **Anonymous Sign-Ins** in Authentication settings.
3. Open **SQL Editor**, paste the full `supabase/schema.sql` and execute it. Review any SQL errors.
4. Copy the Project URL and the browser-safe publishable key (or legacy `anon` key). Never use a `service_role` or secret key in the browser.
5. For local development, create `.env.local` based on `.env.example` and set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
6. Restart `npm run dev`; the top status should read **LIVE ROOMS** after guest auth succeeds.

### If you already applied Phase 02 SQL

Run **only** `supabase/phase_03_tic_tac_toe.sql` in the Supabase SQL Editor, after the Phase 02 schema is already installed. Do not replace a live project's schema manually without reviewing the migration and backup strategy.

### Test from two separate phones

1. Configure both devices to open the same deployed site; with GitHub Pages, add repository Actions secrets named `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` before running the deployment workflow.
2. On phone A, create a **Tic Tac Toe** online room and copy the invite link.
3. On phone B, open the link, choose a different display name, and join.
4. Confirm both room lobbies show two players, then play alternating moves. Moves, wins/draws and rematch requests should sync on both screens.
5. Test wrong-turn taps, occupied cells, refresh/reconnect, both players requesting a rematch, and a room that has closed/expired.

Online play is not verified until the SQL runs cleanly and the two-device test passes. The frontend never contains a service-role key; database writes are only through scoped RPC functions and reads are RLS-protected to room members.

## GitHub Pages deploy

1. Extract the ZIP and upload the **contents of the extracted folder**, not the ZIP file itself, into a new repository. Keep the hidden `.github/workflows/deploy.yml` path.
2. Optional for online play: add the two Supabase variables under **Settings → Secrets and variables → Actions**.
3. Set **Settings → Pages → Build and deployment → Source → GitHub Actions**.
4. Open **Actions** and verify the build workflow passes tests and production build before deployment.
5. Open the published Pages URL. Without Supabase secrets it will be demo mode only.

## QA commands

```bash
npm test
npm run build
```

The rule module was independently compiled with the global TypeScript compiler and 12 rule-level checks passed. All TS/TSX files passed syntax transpilation. This is **not** a substitute for the missing Vitest run, full Vite production build, SQL execution, or actual two-phone browser QA.

## Project docs

- `PROJECT_MASTER.md` — master specification and Phase 03 addendum
- `CURRENT_STATUS.md` — verified, unverified, and pending work
- `TEST_PLAN.md` — automated and manual cases
- `BUGS.md` — known blockers
- `CHANGELOG.md` — phase history
- `docs/PHASE_03_NOTE.md` — short handoff note for the next chat
