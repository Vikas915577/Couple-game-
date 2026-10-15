# YaarJam V1.0

**Tagline:** Apne log. Apna game.

YaarJam is a mobile-first, browser-based multiplayer game hub. V1 includes the game catalogue, guest rooms/lobby, online Tic Tac Toe, and Friends/Couples Truth or Dare. Other games are visible in the catalogue but remain planned—not playable yet.

## What's live in source
- Room creation/joining with 6–8 character codes, host transfer, expiry checks, and realtime lobby refresh.
- Tic Tac Toe: validated online moves, wins/draws, rematch agreement, and same-device demo fallback.
- Truth or Dare: Friends/Couples prompt decks, shared server-selected prompt, turn validation, skip/done counters, and reconnect refresh.
- React + TypeScript + Vite; Supabase Auth/Database/Realtime; GitHub Pages Actions workflow.

## Start Here
Read `START_HERE.md` first. The project URL and public publishable key are preconfigured in `src/lib/supabase.ts`, so no GitHub Actions secrets are required for the selected project. One dashboard setting remains: enable Anonymous Sign-Ins.

## Local commands
Requires Node.js 22+ and npm.

```bash
npm install
npm test
npm run build
npm run dev
```

## Supabase configuration
The V1 schema was applied to the clean project **Vikas915577's Project** (`gvwmisqnepdlejhvacbm`). Do not point YaarJam at the separate **Winter arc** project. Details and exact verification commands are in `SUPABASE_SETUP.md` and `SUPABASE_STATUS.md`.

The URL and publishable key are public browser configuration, not a secret. Never use a service-role or secret key in frontend code. Database writes go through security-checked RPC functions and exposed tables have RLS.

## Honest release status
The remote database schema and permissions have been verified through the Supabase connector. This workspace could not install npm dependencies because registry DNS timed out; therefore a full Vite build and Vitest run have not yet been verified here. GitHub Actions is configured to run them after upload. No actual two-device browser session has yet been tested. Treat online play as unverified until that test passes.
