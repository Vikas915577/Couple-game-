# YaarJam — Current Status

**Current phase:** Phase 02 — secure room lobby foundation  
**Version:** 0.2.0  
**Updated:** 2026-10-15

## Added in Phase 02 source

- Supabase client configured through Vite environment variables.
- Anonymous guest session setup (no email/password prompt).
- Create-room, join-room and leave-room RPC calls.
- Member-only RLS read policies; direct browser table writes are revoked.
- Room names, validated game IDs, display names, capacity, status and 12-hour expiry; closed/expired rooms are excluded from the active-room list.
- Room invite code and deep link query (`?room=CODE`).
- Realtime subscriptions to room and player-list database changes.
- Host transfer to earliest remaining player; empty room closes.
- Display current room, live player list, copy invite link and leave action.
- Fallback local demo mode when Supabase credentials are absent.
- Supabase schema file and GitHub Pages Actions deployment workflow.
- Testing checklist, issue log, changelog, README, upload guide and beginner-friendly `START_HERE.md`.

## Not implemented

- Playable game loops. Truth or Dare, Tic Tac Toe, Chess and Ludo are not yet playable.
- Synchronized moves, game state, chat, profile accounts, rate limiting or admin tools.
- Live Supabase integration cannot be verified in this container because no user's project credentials are configured.

## Verification status

- Source-level TypeScript/TSX syntax transpilation: passed for all 8 source/config files.
- Supplemental strict-null/no-unused internal typecheck using local dependency stubs: passed; this is a partial check and is not a substitute for the real package-backed TypeScript build.
- CSS parser: 288 qualified rules, 0 parse errors.
- Catalogue/room-code smoke assertions: 8 passed.
- JSON/workflow YAML and key security-marker checks: passed.
- Full npm install retried and still blocked by registry DNS (`EAI_AGAIN registry.npmjs.org`).
- Source and documentation files: created.
- Supabase SQL: authored; it still needs to be run in a real Supabase project.
- TypeScript/Vite production build and Vitest suite: **not run here**. npm registry DNS failed (`EAI_AGAIN`), so dependencies and a package lock could not be installed/generated in this environment.
- GitHub Actions workflow: authored to install dependencies, run tests, build and deploy. It has not been run from the user's repository yet.
- Real two-device room sync: **not verified** because it requires a configured Supabase project and a deployed site.
- Browser/mobile layout and realtime QA: pending.

Do not mark the release live until the GitHub Actions build passes and a two-device room create/join test succeeds.
