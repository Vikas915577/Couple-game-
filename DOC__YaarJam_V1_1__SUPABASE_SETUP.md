# Supabase Setup & Live Verification — YaarJam V1

## Selected project
- Project: **Vikas915577's Project**
- Ref: `gvwmisqnepdlejhvacbm`
- URL: `https://gvwmisqnepdlejhvacbm.supabase.co`
- The dedicated project is active and was empty before YaarJam setup. The separate **Winter arc** project contains habit-tracker tables and was not touched.

## What was done
- Applied the full `supabase/schema.sql` through Supabase migration `yaarjam_v1_initial_schema`.
- Added V1 hardening indexes and an explicit deny-read policy on the prompt catalog.
- Verified 5 expected public tables exist; all 5 have RLS enabled; 4 game/lobby tables are in `supabase_realtime`; 20 enabled Truth or Dare prompts exist.
- Verified `anon` cannot execute room/game RPCs directly, while the `authenticated` role can; guest users created through Anonymous Sign-Ins use the authenticated role.
- Ran Supabase security/performance advisors. The security advisor reports intentional `SECURITY DEFINER` RPC endpoints; each validates `auth.uid()`, room membership/turn/state, uses `set search_path = ''`, and has direct execution revoked from `PUBLIC`/`anon`. The performance advisor reports indexes unused on an empty database; this is informational until game data/traffic exists.

## One setting still needs you
The available Supabase connector cannot toggle the Auth dashboard setting. Open [Authentication settings](https://supabase.com/dashboard/project/gvwmisqnepdlejhvacbm/auth/providers), enable **Anonymous Sign-Ins**, and save. Without this, browser guest sessions will be rejected by Supabase Auth.

## Frontend config
The URL and browser-safe `sb_publishable_...` key are preconfigured in `src/lib/supabase.ts` as defaults. This key is intended for browser use; RLS and server-side RPC validation protect the database. Never put a `service_role` or secret key in the app.

Environment variables can override the default:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY` (despite the legacy variable name, use a publishable or legacy anon key only)

No GitHub Actions secrets are required for the selected project if the defaults are retained.

## Verifying in the database
Open SQL Editor and run `supabase/tests/v1_verification.sql`. It checks the expected tables, RLS, Realtime publication, prompt catalog row count, RPC grants, indexes and security-definer search paths.

For a brand-new project only, run `supabase/schema.sql` once. The selected V1 project has already received the schema; do not rerun a full schema on an existing production database. `supabase/v1_hardening.sql` is an idempotent hardening patch for an existing YaarJam schema.

## Live test still pending
Database metadata checks pass, but no real two-phone session has been run from the deployed frontend. GitHub Actions must pass `npm test` and `npm run build`, then run the Step 3 tests in `START_HERE.md` before calling online multiplayer fully verified.
