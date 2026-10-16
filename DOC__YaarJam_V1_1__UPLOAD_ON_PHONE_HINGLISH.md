# YaarJam V1.1 — GitHub upload steps (phone only)

## Part A: upload the one ZIP
1. Download the file named `YaarJam_V1_1_Bundle.zip`.
2. Open https://github.com/Vikas915577/Couple-game-/upload/main
3. Upload the ZIP file **as a file at the repository root**. Do not extract the ZIP in GitHub.
4. Tap **Commit changes** on branch `main`.

## Part B: replace the workflow
1. Open https://github.com/Vikas915577/Couple-game-/edit/main/.github/workflows/deploy.yml
2. Select all text in the editor and delete it.
3. Open `YaarJam_V1_1_BUNDLE_DEPLOY_WORKFLOW.txt` from the downloaded ZIP's outer/root folder.
4. Copy the entire workflow text and paste it into the editor.
5. Commit changes to `main`.
6. Open https://github.com/Vikas915577/Couple-game-/actions
7. Open the newest run named **Test and deploy YaarJam V1.1**. Check all steps: Verify uploaded release ZIP, Run unit tests, Build production website and Deploy website. Do not treat older green runs as the new build result.

The code in the ZIP is built from its own `YaarJam_V1_1/` folder; your existing root-level source files are not overwritten by the ZIP itself.

## Part C: one-time Supabase migration (required for online Ludo/chat/packs)
1. Open https://supabase.com/dashboard/project/gvwmisqnepdlejhvacbm/sql/new
2. In the downloaded ZIP, open `YaarJam_V1_1/supabase/v1_1_social_and_adult_packs.sql`.
3. Copy its **entire contents**, paste into SQL Editor, and tap **Run** once.
4. If an error appears, stop and share the exact error text/screenshot instead of repeatedly running the script.
5. Do not re-run the original `schema.sql` for this upgrade.

## What should work after the migration
- Online Tic Tac Toe and Truth or Dare remain supported.
- Tic Tac Toe vs Computer: Easy/Medium/Hard.
- Ludo online: 2–4 people in one private room, hosted start, server dice/move validation and realtime state; plus local computer / pass-the-phone mode.
- Room text chat is available inside online rooms.
- Truth or Dare classic and added themed prompt packs. Spicy/After Dark require the 18+ confirmation. Prompts are suggestive, not graphic; anyone may pass.
- Would You Rather, This or That, Never Have I Ever, Most Likely To, Guess the Word, Partner Quiz, Our Story and Rock Paper Scissors run locally/pass-the-phone in this release. They are not mislabeled as synchronized online games.

Voice chat and online synchronized voting for the party games are not included in this release.
