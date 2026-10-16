# Changelog — YaarJam

## 1.0.0 — Consolidated V1
- Consolidated Phases 01–05 into one root project package.
- Configured the dedicated Supabase project's public URL and publishable key as browser-safe defaults, with environment override support.
- Applied `yaarjam_v1_initial_schema` and `yaarjam_v1_release_scope_hardening` to the clean `Vikas915577's Project` database; preserved separate Winter Arc database.
- Added 9 hardening indexes and an explicit deny-read policy on the private Truth or Dare prompt catalog.
- Verified 5 tables, RLS on all five, 4 Realtime registrations, 20 seeded prompts, intended RPC grants and hardening indexes.
- Added V1 verification SQL, simplified deployment instructions, current Supabase status, QA report and known-risk log.
- Kept other games clearly marked as planned until their gameplay is implemented.
- Dependency-backed build and two-device online QA remain release gates due npm registry DNS timeout and no real browser session.

## Phase history retained
- 0.5.0: Shared Supabase Truth or Dare state.
- 0.4.0: Local Friends/Couples Truth or Dare.
- 0.3.0: Tic Tac Toe rules and online RPCs.
- 0.2.0: Supabase private room system and realtime lobby.
- 0.1.0: Mobile-first catalogue and room UI.

## V1.0.0 finalization
- Combined phases 01–05 into one source tree.
- Preconfigured the dedicated, browser-safe Supabase project URL/publishable key.
- Corrected misleading catalogue status: only Tic Tac Toe and Friends/Couples Truth or Dare are playable.
- Added disabled planned-game actions and server-side room allowlist/player count validation.
- Added actual-DB verification SQL, hardening indexes and clearer beginner setup instructions.
- No Ludo/Chess or other new gameplay added; stability work only.

## V1 QA bug fix
- Fixed malformed Tic Tac Toe board normalization: invalid/short board payloads now safely preserve valid cells, discard unknown values and normalize to exactly nine cells.
