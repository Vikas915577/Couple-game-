# YaarJam V1 — Bug & Risk Log

| ID | Severity | Item | Status / action |
|---|---|---|---|
| V1-01 | Blocker for online guests | Supabase Anonymous Sign-Ins may still be off | One manual dashboard toggle remains; see `START_HERE.md`. |
| V1-02 | Release gate | Dependency-backed npm/Vite build not run in this workspace | npm registry DNS timed out. GitHub Actions must pass `npm test` and `npm run build` after upload. |
| V1-03 | Release gate | Two-device live session not exercised | Test room create/join, lobby sync, TTT turns/rematch, Truth/Dare prompt sync, Done/Skip, refresh/reconnect and leave. |
| V1-04 | Planned | Ludo, Chess and remaining catalogue games are not playable | Correctly marked PLANNED; room create/join RPCs reject unsupported V1 game IDs. |
| V1-05 | Security advisor warning | 10 SECURITY DEFINER functions callable by authenticated users | Intentional RPCs; anon/PUBLIC execution revoked, empty search_path pinned and caller/membership/turn/state validation applied. Keep under review before broad public launch. |
| V1-06 | Informational performance advisor | Unused indexes on empty database | Expected before traffic; re-check query stats after real use. |
| V1-07 | Abuse protection | Room-code guessing/request rate limits are not implemented | Suitable only for small invite-only friend groups; add rate limiting/monitoring before public scale. |
| V1-08 | Reproducibility | npm lockfile absent | Registry unavailable here; dependency direct versions are pinned. Generate and commit `package-lock.json` after successful `npm install` in a network-enabled environment. |
| V1-09 | Fixed | Short/malformed Tic Tac Toe board normalized to a blank board, discarding valid cells | Fixed: preserves valid X/O, nulls unknown cells and pads/truncates to exactly 9. Regression test now passes. |
| V1-10 | Fixed | Would You Rather and Partner Quiz appeared as first-release games but had no gameplay | Marked PLANNED; UI prevents room creation, and database create/join RPCs enforce the V1 allowlist and 2-player caps. |

No production build, deployment, or two-phone test is marked as passed without evidence.
