# YaarJam V1 — Release Test Plan

## Automated checks (must pass in GitHub Actions)
1. `npm test`
2. `npm run build`
3. No secrets accidentally committed; only the browser-safe Supabase publishable key can appear in frontend config.

## Database verification
Run `supabase/tests/v1_verification.sql` in the selected YaarJam Supabase project. It must return successfully and report 5 tables, 5 RLS-enabled tables, 4 realtime tables and 20 enabled prompts. Verify RPC permission checks and hardening indexes.

## Two-device manual QA
Use two different devices or independent browsers with separate guest sessions.

| Area | Test | Expected result |
|---|---|---|
| Auth | Open site after enabling Anonymous Sign-Ins | Guest session starts, no password needed |
| Create | Device A creates a supported room | Room code appears and creator is listed |
| Join | Device B enters code/invite link | Both devices show the same room/player list |
| Lobby | B joins and A watches | Realtime player count/name updates |
| TTT turn | Current player taps an empty cell | Other phone sees move, turn changes |
| TTT invalid | Wrong player or occupied cell attempts move | Server rejects it, board unchanged |
| TTT result | Test all win lines and a draw | One consistent result displayed |
| Rematch | Only one player requests | Old board remains; waiting state shown |
| Rematch | Both players request | Board resets and X/O roles swap |
| Truth/Dare | Current user chooses Truth or Dare | Same prompt appears on both devices |
| Truth/Dare turn | Another user tries choosing or resolving | Server rejects out-of-turn call |
| Done/Skip | Current user completes/skips | One counter increments, turn moves once |
| Refresh | Refresh one device during lobby/game | State restores from database |
| Leave | Player leaves; host leaves | Membership updates and host transfers/closes room |
| Planned games | Select Ludo/Chess/Would You Rather/Partner Quiz | Clearly shown as planned; room creation is blocked |
| Error path | Invalid/expired/full room code | Friendly error; no blank game screen |

## Release decision
Do not call V1 live/fully working until CI and the above two-device tests are all green.
