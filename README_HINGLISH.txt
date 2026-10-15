YAARJAM V1.0 — ROOT-FOLDER HOTFIX
=================================

What I verified
---------------
The repository's app source is currently in the root folder. However:
- index.html points to /src/main.tsx, which does not exist in this layout.
- App.tsx imports six modules from ./lib/, but no lib/ folder exists.
- tsconfig.app.json includes only src.
- vite.config.ts searches for tests under src/.
- deploy.yml is at the root, so GitHub Actions does not recognize it as a workflow.

This package keeps the existing root layout and corrects config/workflow to match it.
It does NOT contain or replace your whole application source.

Files to update/add in the repository
-------------------------------------
1. Replace index.html with this package's index.html.
2. Replace tsconfig.app.json with this package's tsconfig.app.json.
3. Replace vite.config.ts with this package's vite.config.ts.
4. In App.tsx, apply the six exact import-path replacements in APP_IMPORT_FIXES.txt.
5. Add .github/workflows/deploy.yml from this package to the same exact path in GitHub.

Important
---------
- Keep package.json, the source files, your Supabase URL/key, SQL files and existing user data unchanged.
- Do not paste any Supabase service-role/secret key into frontend files.
- This fixes the folder/config mismatch; it does not prove multiplayer works until CI passes and two-browser/two-phone tests pass.
- I could read the GitHub repository but the connected GitHub integration blocked write/branch operations (403). So I could not commit these changes directly to your repository.
- After these files are applied, open https://github.com/Vikas915577/Couple-game-/actions and check the new workflow run.
- The workflow will run `npm test` and `npm run build`; a red run means the logs need to be fixed before claiming the website is working.

Current site/repo:
https://github.com/Vikas915577/Couple-game-/
