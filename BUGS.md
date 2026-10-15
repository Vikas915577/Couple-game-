# YaarJam — Known Issues / QA Blockers

## Open / verification required

- **QA-001 (blocker):** The Phase 03 SQL has not been executed against a real Supabase project; RPC function syntax, grants, RLS and realtime publication need live verification.
- **QA-002 (blocker):** Live Tic Tac Toe has not yet been tested end-to-end from two separate devices.
- **QA-003 (blocker):** npm dependencies could not be installed because the registry request timed out. Full `npm test` (Vitest) and `npm run build` have not been verified. Only syntax transpilation, isolated game-rule compilation and 12 independent rule checks passed.
- **QA-004:** No `package-lock.json` is included because npm install could not complete. Generate and commit one in a network-enabled environment when possible, then consider switching workflow to `npm ci`.
- **QA-005:** Chess, Ludo, Truth or Dare, couple quizzes and other catalogue games remain not playable. Tic Tac Toe is the only implemented game loop in this phase.
- **QA-006:** No rate limiting or bot/abuse protection is implemented for room creation/joining. Keep this as a friends-only prototype until appropriate controls and security review are completed.
- **QA-007:** Guest identity depends on browser storage. Clearing browser storage or changing device does not recover the anonymous identity; the user can rejoin as a new guest.
- **QA-008:** UI behavior and layout have not been tested in real mobile/desktop browsers from this environment.

Do not report QA-001 through QA-004 as fixed until the relevant external checks pass.
