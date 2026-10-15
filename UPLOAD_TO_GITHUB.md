# YaarJam Phase 02 — quick upload steps

See `START_HERE.md` for the easiest step-by-step guide.

## Demo-only website (quickest first check)

1. Download `YaarJam_Phase_02.zip` and extract it on your phone or computer.
2. Create a **public** GitHub repository for free GitHub Pages.
3. Upload the extracted files and folders; do **not** upload only the ZIP file. Make sure `.github/workflows/deploy.yml` is included.
4. Commit to the `main` branch.
5. Open **Settings → Pages → Source → GitHub Actions**.
6. Open the **Actions** tab and check that the build/test/deploy workflow passes.
7. Open the published site. Without Supabase keys, it intentionally shows **DEMO MODE**.

## Turn on real rooms

1. Create a Supabase project and enable **Anonymous Sign-Ins** in Authentication settings.
2. Run the complete `supabase/schema.sql` file in Supabase SQL Editor.
3. In GitHub repository **Settings → Secrets and variables → Actions**, create `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. Use the Project URL and the browser-safe publishable/anon key only.
4. Push a new commit or use **Actions → Build and deploy YaarJam to GitHub Pages → Run workflow**.
5. Wait for the build to pass, then test one room from two different devices/browsers.

**Important:** Supabase setup is required for cross-device rooms. Room lobby works in this phase; actual game rounds are a later phase. Never use a service-role/secret key in the frontend.
