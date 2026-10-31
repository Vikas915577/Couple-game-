# YaarJam V2 — Offline-first release

**Tagline:** Apne log. Apna game.  
**Version:** 2.0.0  
**Architecture:** Static HTML + CSS + JavaScript. No backend, no Supabase, no Firebase, no login, no database server and no API keys.

## What this release includes

### Phase 1 — Existing game upgrades
- Truth or Dare: Friends and Couples packs, five intensity levels (Chill, Easy, Medium, Bold, Extreme), Truth/Dare switching, optional 18+ acknowledgement, pass/skip and a no-repeat prompt cycle.
- Tic Tac Toe: same-phone two-player, computer opponent with Easy / Medium / Hard (minimax) and Best of 3 / 5 / 7 series.
- Ludo: 2–4 player pass-the-phone, computer opponent, token launch on six, capture/safe cells, bonus turn and exact home movement.
- Would You Rather / This or That: private turn-by-turn voting and reveal.
- Never Have I Ever / Most Likely To: player rotation, private answers and result reveal.
- Partner Quiz: private answer, partner guess and match scoring.
- Our Story: memory prompts and locally saved round text.
- Guess the Word: 30-second timer and round scoring.
- Rock Paper Scissors: Best of 5 against the computer.

### Phase 2 — Prompt library and custom decks
- 381 built-in prompts and game items across Truth, Dare, Romantic, Flirty, Bold, After Dark, party questions, word clues, emoji puzzles, ranking, missions, scenarios and more.
- Local custom Truth / Dare / Romantic / Flirty decks.
- Custom Would You Rather prompts using `Option A | Option B` format.
- Per-device no-repeat history for supported prompt games.

### Phase 3 — Six new games
1. Blind Ranking
2. Secret Mission
3. Emoji Decode
4. Bluff Battle
5. Couple Bingo
6. Memory Match

### Phase 4 — Six more new games
7. Story Builder
8. Date Night Generator
9. Red Flag / Green Flag (two-player private reveal)
10. Same Brain?
11. 20 Questions (host-hidden mystery item)
12. Reaction Battle (two-player timing round)

## Extra local features
- Player profile, avatar and group names (2–10 for party games).
- XP, levels, achievements, wins and recent game history.
- Export / import JSON backup.
- Installable PWA shell and cached static assets for offline reopening after first successful load.
- Mobile-first layout; no remote font, image or script dependency.

## Deploy to the existing GitHub Pages repository

This package is arranged to be copied into the **root** of `Vikas915577/Couple-game-`.

1. Extract the ZIP.
2. Upload/replace these files at the repository root: `index.html`, `styles.css`, `app.js`, `sw.js`, `manifest.json`, `assets/icon.svg`, and `tests-smoke.cjs`.
3. Upload/replace `.github/workflows/deploy.yml` with the workflow included in this package.
4. Keep the existing old source and SQL files in the repository; the new workflow deliberately builds only the static frontend files and does not install or call the old Supabase app.
5. In GitHub → Settings → Pages, choose **GitHub Actions** as the deployment source.
6. Open Actions and confirm the workflow is green. Then open the Pages site on Android Chrome and use **Add to Home screen** if you want an app-like shortcut.

No npm install, secrets, Supabase dashboard settings or SQL migration are required for this V2 static release.

## Local test commands

```bash
node --check app.js
node --check sw.js
node tests-smoke.cjs
```

## Data and limitations

- Profile, XP, custom decks and history stay in the browser's `localStorage`. Clearing browser data may erase them; use Profile → Export backup.
- Multiplayer means same-device pass-the-phone or local-vs-computer. There is no cross-phone live sync, shared room, voice/text chat or central leaderboard.
- The After Dark 18+ prompt selection is only a front-end acknowledgement, not age verification.
- Automated source/interaction smoke tests pass in this package. Final Android device testing after GitHub Pages deployment is still recommended.
