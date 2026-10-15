# YaarJam Phase 03 — quick GitHub upload guide

Read `START_HERE.md` for the full beginner-friendly steps.

## Upload and deploy a demo build

1. Download and extract `YaarJam_Phase_03.zip`.
2. Create a GitHub repository.
3. Upload the extracted files and folders, not only the ZIP file. Keep `.github/workflows/deploy.yml`.
4. Commit the files to `main`.
5. Open **Settings → Pages → Source → GitHub Actions**.
6. Open **Actions**. The workflow must install dependencies, run Vitest and build successfully before deploying.
7. Without Supabase secrets, the site is demo-only. Tic Tac Toe can be played on one device by taking turns.

## Enable real online Tic Tac Toe

1. Enable Anonymous Sign-Ins in the Supabase project's Authentication settings.
2. New Supabase project: run the complete `supabase/schema.sql`. Existing Phase 02 project: run only `supabase/phase_03_tic_tac_toe.sql`.
3. Under repository **Settings → Secrets and variables → Actions**, add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` using the project URL and publishable/anon browser key.
4. Trigger the workflow again and confirm a successful build/deploy.
5. Test a full game and rematch from two separate devices.

**Security:** never put a service-role/secret key into frontend source, a `VITE_*` variable or the repository.  
**QA note:** package install and full build were not verified in this authoring environment; do not treat source syntax checks as a successful release build.
