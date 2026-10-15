> Historical phase handoff. This note describes the state at that phase and is superseded by the current root-level `CURRENT_STATUS.md` and `PROJECT_MASTER.md` (V1.0.0).

**PROJECT: YAARJAM — PHASE 05**
- Added: Supabase-backed shared Truth or Dare for Friends and Couples.
- Shared: Current turn, prompt, used prompt history, completed/skipped totals.
- Security: RLS member-only SELECT; direct browser writes revoked; turn/prompt changes through authenticated SQL RPCs.
- Migration: existing DB → `supabase/phase_05_truth_or_dare.sql`; brand new DB → `supabase/schema.sql` once.
- Config: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`; never use service-role/secret key in frontend.
- Verified here: pending typecheck, dependency-backed tests/build, live SQL and two-device test; no actual Supabase credentials provided.
- Next: get CI green, run migration, then verify shared prompt + turn sync on two phones.
