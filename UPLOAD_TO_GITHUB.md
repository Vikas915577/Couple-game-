# Upload / Repair YaarJam V1

The app must keep this folder layout in the repository root:

- `src/App.tsx`, `src/main.tsx`, `src/styles.css`, `src/catalog.ts`
- `src/lib/` for Supabase, rooms, Tic Tac Toe, and Truth or Dare modules
- `supabase/` for schema and verification SQL
- `.github/workflows/deploy.yml` for automated tests/build/deploy

Do not upload only the source files flat into the repository root. The Vite config expects the `src/` structure.

For phone-first repair steps, see `PHONE_GUIDE.md` and the external `PHONE_FIX_GUIDE_HINDI.txt` included in the complete fixed bundle. GitHub Pages must use **Settings → Pages → Source → GitHub Actions**.

Required remote checks: `npm test` and `npm run build`; the published site should only be considered fixed once GitHub Actions is green and the live website loads.
