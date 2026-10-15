# YaarJam — Known Issues / QA Blockers

## Open / verification required

- **QA-001 (blocker):** Supabase SQL has not been run against a real project; function grants and RLS require live-project verification.
- **QA-002 (blocker):** Real-time lobby has not yet been tested from two separate devices.
- **QA-003 (blocker):** Full Vite/TypeScript build and Vitest suite were not run in the authoring environment because npm registry DNS failed with `EAI_AGAIN` (retested on 15 October 2026). Syntax and a supplemental stub-based internal typecheck passed, but they are not a production build.
- **QA-004:** Package lock could not be generated in this environment. GitHub Actions uses `npm install` rather than `npm ci`; generate and commit a `package-lock.json` with `npm install` in a network-enabled environment when possible.
- **QA-005:** Game rounds are not playable yet; game cards are catalogue entries only.
- **QA-006:** No rate limiting or bot protection on guest room creation/joining is implemented in this first backend slice.
- **QA-007:** Guest identity depends on browser storage. If a user clears local storage or changes browser/device, their anonymous auth identity is not recoverable (they can join using the invite as a new guest).

Do not report QA-001, QA-002, or QA-003 as fixed until the relevant external checks pass.
