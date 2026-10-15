# YaarJam V1 — Phone Repair Guide (Roman Hindi)

Bhai, current repository mein source files root mein flatten ho gaye the, isliye site blank ho rahi thi. Fixed bundle complete original app ko `src/`, `src/lib/`, `supabase/`, aur `.github/workflows/` mein restore karta hai.

## Install the ZIP into the existing repository

1. Download `YaarJam_GitHub_Pages_Fixed_Bundle.zip` from this conversation.
2. Upload that ZIP into the repository root and commit the upload.
3. Start a Codespace on `main`.
4. In its terminal run:

```bash
unzip -q YaarJam_GitHub_Pages_Fixed_Bundle.zip -d /tmp/yaarjam-fix
bash /tmp/yaarjam-fix/INSTALL_TO_THIS_REPO.sh "$PWD" "$PWD/YaarJam_GitHub_Pages_Fixed_Bundle.zip"
```

The script restores the correct source folders, removes only old duplicate files from the broken root upload, then commits/pushes. GitHub Actions runs `npm install`, `npm test`, and `npm run build`; deploy happens only if the checks pass.

## Publish

- Open [GitHub Pages settings](https://github.com/Vikas915577/Couple-game-/settings/pages) and set **Source = GitHub Actions**.
- Open [GitHub Actions](https://github.com/Vikas915577/Couple-game-/actions). All test/build/deploy steps must be green.
- Open the site in Chrome Incognito: https://vikas915577.github.io/Couple-game-/

If Codespaces is unavailable, upload the extracted project preserving the `.github`, `src`, and `supabase` folders from a computer with Git. Uploading a ZIP alone does not extract or deploy its contents.

## Supabase

The existing client config and `supabase/` SQL files are preserved. The installer does not run SQL or change the remote database. Do not re-run the schema against the already configured project. Guest login may need Anonymous Sign-Ins enabled in the Supabase Auth provider settings.
