# Start Here — YaarJam Phase 02

This package contains the Phase 02 source code. Follow this order.

## A. Put the source in GitHub

1. Download `YaarJam_Phase_02.zip` and extract it.
2. On GitHub, create a **public** repository named `yaarjam` (or another name you choose).
3. Upload the **extracted contents**, not the ZIP as a single file. Keep `src/`, `supabase/`, and `.github/workflows/deploy.yml` in the repository root.
4. Commit the files to the `main` branch.
5. Open **Settings → Pages → Build and deployment → Source** and choose **GitHub Actions**.
6. Open **Actions** and choose the `Build and deploy YaarJam to GitHub Pages` workflow. It should run automatically after the commit. It runs the unit test command and production build before deploying.

If the GitHub mobile file picker cannot upload folders, use a desktop browser or another Git-aware upload method. Uploading only the ZIP file will not deploy the application.

## B. Try demo mode first

No Supabase credentials are needed to publish the UI preview. It will show **DEMO MODE**. Demo rooms exist only in that browser; a friend on another phone cannot join a demo room.

## C. Enable cross-device rooms

1. Create a Supabase project and enable **Authentication → Anonymous Sign-Ins**.
2. Run the complete `supabase/schema.sql` in Supabase SQL Editor and check that it finishes without errors.
3. In GitHub, open **Settings → Secrets and variables → Actions** and add repository secrets named `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. Use your project URL and browser-safe publishable/anon key only.
4. Run the GitHub Actions workflow again.
5. On phone A, create a room and share its code/link. On phone B, open the same deployed site, enter a different player name and join. Confirm both phones show both players.

**Never** put a Supabase `service_role` / secret key in frontend code or any `VITE_*` variable.

## Current limitation

Phase 02 implements room/lobby membership and live player-list refresh, not playable rounds. Tic Tac Toe, Truth or Dare, Chess and Ludo gameplay will be added in later phases. The authoring environment could not download npm dependencies because `registry.npmjs.org` returned `EAI_AGAIN`; therefore the full build and Vitest suite have not been verified locally. Do not call the deployment verified until GitHub Actions succeeds and the two-phone test passes.
