# YaarJam V1 QA Report

## Passed against the actual Supabase project
- Full initial schema migration succeeded on `gvwmisqnepdlejhvacbm` (“Vikas915577's Project”). The separate “Winter arc” project was not changed.
- 5/5 expected public tables exist and all 5 have RLS enabled.
- 4/4 lobby/game-state tables are registered with `supabase_realtime`.
- 20 enabled Truth or Dare prompts are seeded.
- Verification SQL `supabase/tests/v1_verification.sql` executed successfully and returned: 5 tables, 5 RLS tables, 4 Realtime tables, 20 prompts.
- `anon` cannot execute the intended room/game RPCs; `authenticated` can call the intended endpoints. Authenticated clients cannot directly insert/update room tables.
- 9 V1 hardening indexes exist; prompt catalog direct reads are denied.
- All 10 SECURITY DEFINER functions have an empty pinned `search_path`.
- Server-side room RPCs only allow the 3 playable V1 modes and enforce two-player caps for couples/Tic Tac Toe.

## Source and gameplay tests executed in this workspace
- TypeScript/TSX syntax transpilation: 14 files, 0 syntax diagnostics.
- Supplemental TypeScript check with local external-module stubs and `noUnusedLocals`/`noUnusedParameters`: passed. This is not a substitute for dependency-backed Vite typecheck/build.
- Existing unit-test cases were executed through a small offline-compatible runner (same test files, Vitest unavailable): 26 passed, 0 failed.
- During this QA pass, a real bug was caught by the `normalizeBoard` regression test: short board payloads discarded valid cells. Fixed to preserve valid X/O values and normalize to exactly nine cells; all 26 cases passed after the fix.
- CSS brace checks, package/config JSON parse, workflow YAML parse, SQL source safety patterns and ZIP integrity are checked before packaging.

## Supabase advisor findings
- Security advisor returns 10 warnings for authenticated-callable SECURITY DEFINER room/game RPCs. They are intentional atomic-write endpoints; direct execution from `PUBLIC`/`anon` is revoked, each pins empty `search_path`, and caller/membership/turn/status is validated. These warnings are not proof of a vulnerability, but the functions must be reviewed before public scale.
- Performance advisor shows unused-index INFO notices because no rooms/game traffic exists yet.

## Release gates not yet passed
- Enable Anonymous Sign-Ins in the Supabase Auth dashboard (connector cannot toggle this).
- npm registry DNS failed in this workspace, so real `npm test` via Vitest and the `npm run build` Vite production build could not be run here. GitHub Actions must pass after upload.
- Two-device browser test is still pending: room create/join, lobby sync, Tic Tac Toe move/win/rematch, Truth/Dare turn/prompt/skip, refresh/reconnect and leave/host transfer.
