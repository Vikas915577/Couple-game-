# Start here — YaarJam Phase 03

This package adds the first playable game: Tic Tac Toe. Read this first if you're uploading to GitHub from a phone.

## 1. Upload to GitHub

1. Download and extract `YaarJam_Phase_03.zip`.
2. Open your new GitHub repository.
3. Upload the *contents* of the extracted folder. Do not upload only the ZIP file. Keep hidden `.github/workflows/deploy.yml` and all `src/` / `supabase/` files.
4. Commit the files to `main`.
5. Under **Settings → Pages**, set **Source** to **GitHub Actions**.
6. Open **Actions** and review the build log. It must pass tests and build before deploying.

Without Supabase secrets, the website uses demo mode. You can test Tic Tac Toe as pass-and-play on one device; cross-device play is not available in demo mode.

## 2. Run tests/build where npm can reach the registry

Install Node.js 22+ and run:

```bash
npm install
npm test
npm run build
```

The authoring environment could not reach `registry.npmjs.org`, so the full dependency-backed tests/build were not verified here. Do not skip GitHub Actions results.

## 3. Supabase setup

- New Supabase project: enable Anonymous Sign-Ins, then run the complete `supabase/schema.sql` in SQL Editor.
- Existing Phase 02 project: run only `supabase/phase_03_tic_tac_toe.sql`.
- Add the Project URL and publishable/anon key as repository Actions secrets named `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
- Never use the service-role/secret key in frontend code or `VITE_*` variables.

## 4. Test online gameplay on two phones

1. Phone A opens the deployed site and creates a Tic Tac Toe online room.
2. Copy and send the invite link to Phone B.
3. Phone B opens the link, uses a different guest name and joins.
4. Check that both see two room members. Play alternating X/O moves.
5. Confirm invalid moves are rejected, winner/draw syncs, refresh restores the board, and both players must request a rematch.

## Honest status

12 rule-level checks and all TypeScript/TSX syntax transpilation passed in the build environment. Full Vitest/Vite build, Supabase SQL and actual two-phone tests remain pending.
