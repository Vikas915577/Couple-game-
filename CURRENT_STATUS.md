# YaarJam — Current Status

**Current phase:** Phase 03 — first playable game  
**Version:** 0.3.0  
**Updated:** 15 October 2026

## Implemented in source

- Kept the Phase 01/02 mobile-first catalogue, guest-room lobby, room codes, Supabase room RPCs, RLS and GitHub Pages workflow.
- Added Tic Tac Toe local demo pass-and-play for trying the board without backend setup. This is one device only.
- Added online Tic Tac Toe state schema and server RPCs: `start_ttt_game`, `play_ttt_move`, `request_ttt_rematch`.
- Online moves are authorized and validated in PostgreSQL: room membership, active room, assigned player, current turn, cell range, occupied cell, game status, winner and draw.
- Rematch requires each player to request; when both agree, X/O ownership swaps and the board resets.
- Added realtime change subscription for online game state, refetch-after-subscribe recovery, board state labels, winning-line highlight and a responsive mobile layout.
- Leaving mid-game resets the room to waiting so a new guest can join and start a new round.
- Added pure TypeScript game rules and 10 Vitest tests in `src/lib/tic-tac-toe.test.ts`.
- Added `supabase/phase_03_tic_tac_toe.sql` for existing Phase 02 deployments and appended that migration to `supabase/schema.sql` for fresh projects.
- Updated README and phase-specific instructions.

## Not implemented

- Chess, Ludo, Truth or Dare and other game catalogue entries are not playable yet.
- Chat, permanent user accounts, rate limiting/anti-bot protections, admin dashboard, push notifications and broad load testing are not implemented.
- No user's Supabase project or credentials are configured in this authoring environment.

## Verification status

- All `.ts`/`.tsx` source files passed TypeScript syntax transpilation: passed.
- The game-rules module passed strict standalone TypeScript compilation: passed.
- 12 independent rule-level checks executed against the compiled rules module: passed.
- Supabase SQL, RLS, migrations and RPCs: authored but **not executed against a live Supabase project**.
- `npm install` timed out contacting the npm registry. Therefore `npm test` (Vitest) and full `npm run build` were **not run successfully** here.
- `tsc -b` attempted but could not type-check the whole app because React, Supabase and other package type declarations were not installed. Its missing-module errors are an environment/dependency blocker, not a passing build result.
- GitHub Actions deployment and real two-phone gameplay: not yet run/verified.
- UI browser QA and mobile layout across real devices: pending.

Do not mark online gameplay as verified until dependencies install, Vitest and production build pass, the SQL migration executes cleanly, and a two-device match passes end-to-end.
