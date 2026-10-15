# YaarJam — Phase 02: private realtime rooms

**Tagline:** Apne log. Apna game.

Phase 02 keeps the mobile-first Phase 01 interface and adds the first backend foundation: anonymous guest sessions, Supabase-backed room creation and joining, room-member list, host handoff/leave handling, invite codes/links, and realtime lobby refreshes.

## What is and is not working in this phase

**Implemented in source:**
- Create an online room through a Supabase RPC.
- Join by a six-to-eight character room code or an invite URL (`?room=CODE`).
- Guest display name (no email/password), max player count, room open/closed status, and a 12-hour room expiry.
- Room player list refresh through Supabase Realtime Postgres Changes.
- Leave a room; if the host leaves, the oldest remaining player becomes host. Empty rooms close.
- RLS-protected read access. All table writes are through narrowly scoped RPC functions; the browser has no service-role key.
- A local demo fallback when environment values are absent, so the website shell can still be explored before backend setup.
- GitHub Pages Actions deployment workflow; its build runs tests before deploying.

**Not implemented yet:** playable game rounds, turn/move synchronization, permanent profiles, chat, push notifications, anti-abuse rate limiting, and comprehensive browser/device QA. Ludo and Chess catalogue cards are still not playable in this phase. A live multiplayer claim applies only to room/lobby membership, after Supabase is configured.

## Quick local preview (no Supabase required)

Requirements: Node.js 22+ and npm.

```bash
npm install
npm run dev
```

Open the localhost URL printed by Vite. Without `.env.local`, the app says **DEMO MODE** and only creates local preview rooms.

## Enable real rooms with a free Supabase project

1. Create a Supabase project at <https://supabase.com/dashboard>.
2. In **Authentication settings**, enable **Anonymous Sign-Ins**. The app uses anonymous guest accounts; if a user clears browser storage or changes devices, their anonymous identity does not transfer. They can still join a room on another device as a different guest.
3. Open **SQL Editor** in Supabase, open this repo's `supabase/schema.sql`, paste the full file and run it. Check for any SQL errors before proceeding.
4. In the project's API/Connect settings, copy the **Project URL** and the browser-safe **publishable key** (or legacy `anon` key). Do not use the `service_role`/secret key.
5. For local testing, copy `.env.example` to `.env.local` and replace the placeholders:

   ```dotenv
   VITE_SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co
   VITE_SUPABASE_ANON_KEY=YOUR_PUBLISHABLE_OR_ANON_KEY
   ```

6. Restart `npm run dev`. The top status should become **LIVE ROOMS** after the guest session starts.
7. Open the site on two different devices/browsers. On device A, create a room. Copy the code or invite link. On device B, open the site/link, enter a different display name, and join. Both lobby player lists should update. This only tests the room lobby, not a playable board-game round.

## Deploy to GitHub Pages from an uploaded ZIP

1. Download and extract `YaarJam_Phase_02.zip`.
2. Create a new **public** GitHub repository (GitHub Free includes Pages for public repositories). Upload the **contents** of the extracted folder, not the ZIP file itself. Commit the files to `main` (or `master`). Keep the hidden `.github/workflows/deploy.yml` file in the repository; a ZIP uploaded as a single file will not be built or deployed.
3. For **demo-only** GitHub Pages, skip the Supabase setup below. The workflow builds a demo version.
4. For real rooms, go to **Repository → Settings → Secrets and variables → Actions → New repository secret** and add:
   - `VITE_SUPABASE_URL` = your Supabase Project URL
   - `VITE_SUPABASE_ANON_KEY` = your Supabase publishable/anon browser key
5. Go to **Repository → Settings → Pages** and set **Build and deployment → Source → GitHub Actions**.
6. Open the **Actions** tab. Wait for the `Build and deploy YaarJam to GitHub Pages` workflow to pass. The workflow runs `npm test` and `npm run build` before deploying.
7. Open the published Pages URL on two separate devices. Run the same create/join test above.

The frontend key is public by design; actual data protection is provided by the RLS policies and RPC functions in `supabase/schema.sql`. Never add a Supabase service-role key to repository files, GitHub Actions `VITE_*` variables, or frontend code.

## Local checks

```bash
npm test
npm run build
```

A completed GitHub Actions deployment is the easiest independent build/test check when local package installation is unavailable. If the workflow fails, open the failed job log and check the first failing step before trying to deploy again.

## Files to keep updated

- `PROJECT_MASTER.md` — agreed scope and architecture.
- `CURRENT_STATUS.md` — what is complete and what is not.
- `TEST_PLAN.md` — repeatable manual and automated tests.
- `BUGS.md` — known issues / QA blockers.
- `CHANGELOG.md` — version history.
- `supabase/schema.sql` — database schema and access rules.
