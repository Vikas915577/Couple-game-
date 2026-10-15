# Phase 03 handoff — copy into the next chat

**Project:** YaarJam (`Apne log. Apna game.`)  
**Version:** 0.3.0  
**Phase:** 03 — Tic Tac Toe implemented in source

## Completed in source
- Keep Phase 01/02 catalogue and Supabase room lobby.
- Tic Tac Toe is playable as same-device pass-and-play in demo mode.
- Online Tic Tac Toe uses Supabase RPCs for initialization, server-validated moves and rematch requests.
- SQL checks membership, current turn, cell index, occupied cell, round status and room active state. Rematch requires both player requests and swaps X/O.
- Added responsive UI, player labels, winner/draw status, winning-line highlight and realtime state subscription.
- Added 10 Vitest cases; 12 rule-level checks executed against the compiled pure rules module passed.

## Not verified
- `npm install` timed out against npm registry. Full Vitest and Vite build not run.
- SQL/RLS was not run against real Supabase.
- Two-device online match and rematch not tested.
- Chess, Ludo, Truth or Dare and other listed games not playable yet.

## Next action
1. In a network-enabled environment, run `npm install`, `npm test`, `npm run build` and fix any failures.
2. For a fresh Supabase project, run `supabase/schema.sql`. For an existing Phase 02 project, run only `supabase/phase_03_tic_tac_toe.sql`.
3. Add GitHub Actions secrets `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`; deploy from GitHub Actions.
4. Test one room on two phones, invalid moves, wins/draws, refresh/reconnect and dual-consent rematch.
5. Only after checks pass, start the next game module.

**Deliverable:** `YaarJam_Phase_03.zip` (source package, not a verified live deployment). Never claim full build/live QA is complete until the above checks pass.
