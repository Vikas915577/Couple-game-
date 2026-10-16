# YaarJam V1.1

**Tagline:** Apne log. Apna game.

YaarJam is a mobile-first browser game hub built with React, TypeScript, Vite and Supabase. This V1.1 bundle preserves the V1 source and adds computer play, local party games, room chat and a pack-based Truth or Dare experience.

## What's included

- **Tic Tac Toe:** existing online rooms plus same-phone mode and Easy / Medium / Hard computer opponents. Hard uses minimax and should not lose when it plays correctly.
- **Ludo:** local vs computer and 2–4 player pass-the-phone; online 2–4 player rooms with server-generated dice, server-validated token moves, capture/safe-square logic, realtime sync and host reset after the V1.1 SQL migration.
- **Friends chat:** room-scoped text chat with a 500-character cap, recent history, realtime updates and a server-side send RPC with member checks/rate limit.
- **Truth or Dare:** classic, funny, romantic, flirty, spicy (18+) and After Dark (18+) packs. The more mature packs are suggestive, not graphic; prompt skipping and partner comfort are always allowed.
- **Party games:** Would You Rather, This or That, Never Have I Ever, Most Likely To, Guess the Word, Partner Quiz, Our Story Quiz and Rock Paper Scissors. These are playable locally / pass-the-phone; cross-phone synchronized voting for these party rounds is not claimed in this release.
- **Room invitation:** existing code + invite link and the current lobby member list.

## Important release setup

The project source lives under `src/`. For the ZIP-based mobile deployment flow, upload the **outer** `YaarJam_V1_1_Bundle.zip` to the root of the GitHub repository, then use the included `DEPLOY_WORKFLOW.txt` to replace `.github/workflows/deploy.yml`. GitHub Actions will extract the bundle, run `npm test`, run `npm run build`, and deploy the built `dist` folder to Pages.

After the build/deployment passes, apply **`supabase/v1_1_social_and_adult_packs.sql`** once in Supabase Dashboard → SQL Editor, after the existing V1 schema. This enables secure room chat, online Ludo and online prompt packs. Do not rerun the original full schema just to apply this upgrade.

Dedicated Supabase project: `gvwmisqnepdlejhvacbm` (Vikas915577's Project). Do not switch YaarJam to the unrelated Winter Arc project. Browser configuration uses the public publishable key only. Never put a service-role / secret key in frontend code.

## What is not claimed as finished

- No voice chat in V1.1; text chat is included. Voice chat needs a separate WebRTC implementation and device/network testing.
- Party game votes are local/pass-the-phone only; online synchronized party rounds are a later game-state migration.
- Online multiplayer and cross-phone Ludo are enabled only after the V1.1 SQL migration is applied and two-to-four-device testing passes.
- Browser-based build/test still needs a green GitHub Actions run for the exact uploaded ZIP; local npm installation in the preparation environment timed out because the registry was unreachable.

## Local commands

Node.js 22+ and npm 10+ are recommended.

```bash
npm install
npm test
npm run build
npm run dev
```
