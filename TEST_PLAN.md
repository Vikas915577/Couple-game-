# YaarJam Phase 03 — Test Plan

## Automated tests

From a network-enabled environment with Node.js 22+: run `npm install`, `npm test`, and `npm run build`. GitHub Actions runs tests and build before deployment.

The new `src/lib/tic-tac-toe.test.ts` Vitest suite covers:
- Empty board initialization.
- Valid move and immutable board input.
- Invalid indexes and occupied-cell rejection.
- Horizontal, vertical and diagonal win detection.
- Winning-line highlight data.
- Draw detection.
- Rejecting a move after a round has ended.
- Player ID to X/O mapping.
- Normalizing malformed database board values.

The rules module was compiled in isolation with global `tsc`, and 12 independent rule-level checks passed. All TS/TSX files passed syntax transpilation. The Vitest suite and complete build remain unverified because npm registry access timed out in this environment.

## Demo mode (no backend)

- [ ] Create a demo Tic Tac Toe room, select “Go to my rooms”, and confirm the board appears.
- [ ] X and O can alternate moves on the same device.
- [ ] A move can only fill an empty square.
- [ ] Win by rows, columns and diagonals; winning cells highlight.
- [ ] Reach a draw; it must be detected.
- [ ] No move can be made after win/draw.
- [ ] Play again resets the board and changes the starting mark.
- [ ] UI clearly states that demo mode is not shared with other devices.
- [ ] Verify the same flow on a narrow Android screen and a desktop browser.

## Supabase SQL/migration

- [ ] For a new project, run the complete `supabase/schema.sql`; for a Phase 02 project, run only `supabase/phase_03_tic_tac_toe.sql`.
- [ ] Enable Anonymous Sign-Ins.
- [ ] Verify the new table uses RLS, only room members can select game state, and direct client table writes are denied.
- [ ] Verify only authenticated users can execute the game RPCs.
- [ ] Check for SQL errors and check the realtime publication includes `tic_tac_toe_games`.

## Online two-device game

- [ ] Player A creates a Tic Tac Toe online room.
- [ ] Player B joins with the invite link from a different phone/browser.
- [ ] Both players see the same board and status.
- [ ] First player is X; second player is O; X makes the first move.
- [ ] The non-current player cannot make a move even if an API/RPC is called directly.
- [ ] Occupied cells, indexes outside 0–8, and moves after round completion are rejected server-side.
- [ ] Win/draw status and winning cells sync to both devices.
- [ ] One rematch request waits; the second request resets the board and swaps X/O roles.
- [ ] Refresh a device during a game and verify the current state is restored from Supabase.
- [ ] A non-member cannot read or write another room's game state.
- [ ] Closed/expired rooms cannot start or accept moves/rematch.
- [ ] If either guest leaves mid-game, the remaining player returns to waiting state and a new guest can join cleanly.
- [ ] No service-role key is included in source, environment examples or generated browser bundle.

## Release criteria

Do not call Phase 03 fully verified until Vitest and production build pass, SQL applies cleanly, and a two-device online round plus rematch passes.
