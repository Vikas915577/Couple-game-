# YaarJam V1 — Start Here (simple steps)

Bhai, pehle sirf ye steps follow karo. Is ZIP mein sab phases ka current combined code hai; purane phase ZIPs ko alag upload karne ki zarurat nahi.

## Step 1 — Supabase ka ek setting on karo (one-time)

1. Open the [YaarJam Supabase Authentication settings](https://supabase.com/dashboard/project/gvwmisqnepdlejhvacbm/auth/providers).
2. Find **Anonymous Sign-Ins** (or the anonymous provider setting) and enable it.
3. Save changes.

I have already applied the database schema to the selected clean YaarJam project and verified the five tables/RLS/realtime registration. Your separate **Winter arc** database was not changed.

## Step 2 — ZIP ko GitHub par upload karo

1. Download and extract `YaarJam_V1.zip` on your computer.
2. Create a new empty GitHub repository, for example `yaarjam`.
3. Upload **the contents of the extracted `YaarJam_V1` folder** to the repository root. Do not upload just the ZIP; keep folders like `src`, `supabase`, and `.github`.
4. Open repository **Settings → Pages → Build and deployment → Source → GitHub Actions**.
5. Open **Actions**. The workflow should install dependencies, run tests, build the site, and deploy it. If it fails, open the red workflow run and share the first error with ChatGPT.

No GitHub Actions secrets are required for the selected YaarJam project: the public Supabase URL and publishable key are already configured as browser defaults. These are public client values, not the secret/service-role key.

## Step 3 — two-phone test

1. Open the deployed website on your phone and create a room for **Tic Tac Toe** or **Truth or Dare**.
2. Copy/share the room code or invite link to a friend.
3. Have them open the link in another phone/browser and join with a different name.
4. Check that the player list updates. For Tic Tac Toe, test turns/win/rematch. For Truth or Dare, test choosing Truth/Dare, shared prompt, Done/Skip and turn changes.
5. Refresh one phone and confirm that the saved state returns.

## If something fails

- `Anonymous sign-ins are disabled`: return to Step 1 and enable Anonymous Sign-Ins.
- `relation/function does not exist`: open `supabase/schema.sql` and check that it was successfully applied to the selected YaarJam project. Don't run it on Winter arc.
- Build fails: send the first red error from GitHub Actions; do not change random files.

The catalogue shows more games than currently playable. V1's real online game modes are Tic Tac Toe and Truth or Dare; Ludo/Chess/other rounds are future work.
