# YaarJam V1 — Current Status

**Version:** 1.0.0  
**Product state:** Combined V1 source package and Supabase schema installed.

## Included in V1
- Phase 01: mobile-first catalogue, search, categories and lobby UI.
- Phase 02: Supabase guest room create/join/leave, room codes, member list and realtime lobby.
- Phase 03: online Tic Tac Toe with validated moves, win/draw and rematch; local demo fallback.
- Phase 04: local Friends and Couples Truth or Dare.
- Phase 05: shared Supabase Truth or Dare state, server prompt selection, turn validation, Done/Skip counters and reconnect refresh.
- Preserved phase notes, master spec, changelog, bug log, SQL schema, security/performance test scripts and GitHub Pages workflow.

## Actual Supabase setup result
- Applied migrations `yaarjam_v1_initial_schema` and `yaarjam_v1_release_scope_hardening` to `Vikas915577's Project` (`gvwmisqnepdlejhvacbm`). The separate `Winter arc` project was untouched. The verification SQL executed successfully.
- Five expected tables exist; all five have RLS enabled; four realtime tables are registered; 20 prompts are seeded.
- Checked RPC permissions (`anon` denied, `authenticated` permitted for intended game functions), pinned `search_path` on all 10 SECURITY DEFINER functions, disabled direct client table writes and confirmed 9 hardening indexes. The create/join RPCs now reject planned games and enforce the two-player limit for Tic Tac Toe/Couples.
- Supabase advisors report intentional SECURITY DEFINER RPC warnings and informational unused-index messages for the new/empty database.
- Remaining Auth task: enable Anonymous Sign-Ins in the dashboard; this connector can't toggle that setting.

## Build / device QA status
- TypeScript/TSX syntax checks, supplemental noUnused TypeScript check and the offline-compatible runner passed 26 cases (see `docs/QA_REPORT_V1.md`).
- `npm install` cannot complete in this workspace because npm registry DNS times out; full dependency-backed Vitest and Vite production build are therefore not claimed as passed.
- GitHub Actions is configured to run tests and build after upload. Two-device browser test is still pending.

## Current playable features
- Online room lobby.
- Online Tic Tac Toe.
- Online Truth or Dare (once anonymous sign-in is enabled).
- Local same-device demo mode.

Ludo, Chess, Would You Rather and other catalogue games remain planned cards and do not yet have complete gameplay.
