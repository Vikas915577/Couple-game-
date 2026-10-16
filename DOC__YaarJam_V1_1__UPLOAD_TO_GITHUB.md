# Upload YaarJam V1 to GitHub Pages

1. Extract `YaarJam_V1.zip`.
2. Create an empty GitHub repository.
3. Upload the contents of the extracted `YaarJam_V1` folder to the repository root (include `.github`, `src`, `supabase`, and config files).
4. Go to Settings → Pages → Source → GitHub Actions.
5. Open Actions and verify the build/tests pass and deployment completes.

The Supabase public URL and publishable key are preconfigured as source defaults. No GitHub secrets are required for the selected project unless you want to override the config.

For online rooms, first enable Anonymous Sign-Ins in the project's Auth settings. The V1 database schema is already applied to the selected project; don't run `schema.sql` again there. See `SUPABASE_STATUS.md` and `START_HERE.md`.
