# YaarJam — Project Master Specification

**Version:** 0.3 (Phase 03 playable Tic Tac Toe addendum)  
**Prepared:** 15 October 2026  
**Status:** Phase 03 Tic Tac Toe source added; package-backed build, Supabase execution, and live QA are pending  
**Working name:** YaarJam (provisional; domain/trademark/app-name availability not verified)

## 1. Vision

Build a free-to-start, mobile-first multiplayer gaming website where a small group of friends can open a link on their phones, join a private room, and play several games together. It should work in a browser on Android, iPhone, and desktop without requiring an app-store install.

**Core promise:** One website, one private room flow, multiple games.

## 2. Product principles

1. **Friend-first:** create a room, copy/share a link or code, friends join as guests where possible.
2. **Mobile-first:** design for 360 px wide screens first; no congested desktop-like layout.
3. **One clear action per screen:** big tap targets, short labels, obvious current turn/status.
4. **Small releases:** ship and test one module at a time; no giant rewrite.
5. **Correct state over flashy animation:** the database/trusted backend is authoritative for multiplayer moves.
6. **Free-first:** prefer free tiers and open-source libraries; recheck pricing/quota before launch. “Free” is subject to provider terms/limits, not a guarantee of unlimited usage.
7. **Privacy by default:** avoid collecting phone numbers, contacts, precise location, or unnecessary profile data.
8. **Recoverability:** version control, changelog, tests, and a rollback point for every milestone.

## 3. Research insights

### Multi-game social experiences
- Plato's official catalogue presents 50+ games within one social experience. The useful lesson is not to match its game count, but to make room creation, invite sharing, player status, and return-to-lobby consistent across every game.
- A current Would You Rather party-game listing combines private online rooms, friend duels, couple categories, custom questions, and Never Have I Ever. This supports using shared question-game mechanics with different Friends and Couples packs rather than duplicating the whole feature.
- Current couple-game roundups distinguish conversation cards, relationship quizzes, competitive two-player games, and dare/challenge games. The project should include more than a Truth or Dare screen: couple quizzes, shared-choice games, and date-night prompts give users different ways to play.
- Browser-board-game examples show demand for simple room codes, guest names, mobile browser access, and a direct invite link. Our differentiator should be combining board games with friendship and couple party modes in one uncluttered private-room flow.

### Naming research
- Search results surfaced existing products/presence for PlayAdda, GameYaar, and playMingle/PlayMingle. Avoid these earlier candidates to reduce confusion.
- YaarJam is the new recommended working name. Basic web searching did not surface an obvious exact-name gaming competitor in the results reviewed, but this is not proof of domain, trademark, or social-handle availability.
- Official Indian trademark search is available through IP India's public-search portal. Final clearance requires a proper similarity search in relevant classes and checking the desired domains/handles; do this before public launch.

### Multiplayer architecture
- Supabase Realtime documents Broadcast for low-latency messages/custom game events and Presence for changing online state. Presence should not carry every game move; reserve it for online/ready status and use Broadcast for relevant event notification.
- Supabase Free and Cloudflare Pages Free have quotas and operational limits. Recheck exact current allowances before setup/deployment and do not promise unlimited free usage.
- Use a tested chess rules library such as `chess.js` for legal moves, check/checkmate and draw detection rather than rewriting the chess rule engine from scratch.
- Authorization must not rely only on the frontend. Every meaningful room operation and move needs trusted/server-side permission and state validation.

## 4. Provisional name and brand

**Preferred working name:** YaarJam  
**Tagline option:** “Apne log. Apna game.”  
**Positioning:** One place for friends, couples, and small groups to play online together.

Why this name: short, friendly, easy to say in Hinglish, and broad enough for Ludo, Chess, party games, and couple games. Avoid names already surfaced in the initial research, including PlayAdda, GameYaar, and PlayMingle.

**Important:** YaarJam is a working name, not a cleared brand. Basic web searches did not surface an obvious exact-name game brand, but domain availability, app-store use, social handles, and trademark similarity have not been verified. Check them before a public launch. Keep the brand string in one config file so it can be changed safely.

## 5. Target users and access

- Friends playing in a private group.
- Couples who want a two-player social game mode.
- Casual board-game players.
- Primary device: Android phone browser; also support iPhone and desktop browsers.

For the first release, prioritize private rooms and invite-only play over public matchmaking or a large social network.

## 6. Core user journey

1. Open the website.
2. Choose a game.
3. Tap **Create Room** or **Join Room**.
4. Enter a display name (guest mode by default) and choose room options.
5. Host shares a link/code through the phone’s share sheet or copy button.
6. Friends join and appear in the lobby; host sees who is present and who is ready.
7. Host starts the game when player count and readiness rules are satisfied.
8. Players act in turns; all connected players see consistent game state.
9. If a player refreshes or temporarily loses network, they can rejoin and resync within a defined grace period.
10. Show result/rematch/return-to-lobby actions.

## 7. Information architecture

Main screens:
- **Home:** brand, “Create Room”, “Join Room”, featured game cards, clear room-status/error messages.
- **Game Directory:** games grouped by Board, Party, Friendship, Couple.
- **Room Lobby:** room code + copy/share, player list, host badge, readiness, player cap, start button, leave-room action.
- **Game Screen:** game board/cards, current turn, connection indicator, game-specific help/rules, skip/undo only where permitted, exit confirmation.
- **Results:** winner/result, rematch, return to lobby.
- **Settings/Help:** display name, sound/haptics (optional), accessibility and rule summaries.

Navigation should be shallow. Do not add public profiles, leaderboards, voice/video chat, payments, coins, or friend-finding during the initial build.

## 8. Proposed game roadmap

## Planned game catalogue

### Board games
1. **Ludo** — 2–4 players; classic-style rules with our documented house-rule preset.
2. **Chess** — 1v1; full legal chess rules, no AI required for the first release.
3. **Tic Tac Toe** — 2 players; simple fast game and the first board-game engine used to prove room state and turn validation.
4. **Connect Four** — 2 players; later expansion after the core game engine and room sync are stable.
5. **Snakes & Ladders** — 2–4 players; later expansion.

### Party and friendship games
6. **Truth or Dare — Friends Pack** — funny, getting-to-know-you, and group-friendly prompts.
7. **Would You Rather — Friends Pack** — vote on an option and reveal the group's split.
8. **Never Have I Ever** — friendship and couple prompt packs; no drinking requirement or penalty is built into the game.
9. **Most Likely To** — group voting/pointing prompts; results reveal after everyone votes.
10. **Who Knows Me Best? — Friends Quiz** — one player chooses or answers a prompt; friends guess, then results reveal.
11. **Guess the Word / Who Am I?** — team or group guessing, later expansion.

### Couples Corner
12. **Couple Truth or Dare** — separate Cute, Romantic, and Deep Talk packs; a skip button is always available. Keep prompts non-explicit in the initial release.
13. **How Well Do You Know Your Partner?** — both partners answer/guess; show the match only after both have locked answers.
14. **Couples This or That / Would You Rather** — compare preferences and reveal whether answers match.
15. **Our Story Quiz** — fun prompts about favourites, memories, firsts, and shared plans; fully optional, with no requirement to disclose private details.
16. **Date Night Spinner** — suggests a meal, movie, walk, activity, or conversation topic; users can skip/re-spin.
17. **Couple Never Have I Ever** — separate prompt pack, with skip and comfort-first defaults.

The catalogue uses shared question, voting, scoring, and room components. “Couple mode” is not a separate account system; it is a distinct content pack and round flow. Any compatibility score is for fun only, not a scientific assessment.

### Delivery order (not all games in one coding step)
- **Private prototype / MVP:** room system, Tic Tac Toe, Truth or Dare (Friends + Couples), Would You Rather (Friends + Couples), and How Well Do You Know Me (Friend + Couple pack). This proves room sync and the reusable question-game system.
- **Core v1 before wider launch:** Ludo, Chess, Never Have I Ever, Most Likely To, Couples This or That, Our Story Quiz, and Date Night Spinner.
- **Later additions:** Connect Four, Snakes & Ladders, Guess the Word/Who Am I, custom question packs, and more content packs.

Do not claim a game complete until its rules, permissions, reconnect behavior, and multiplayer tests pass.

## 9. Initial game rules and product choices

### Truth or Dare — proposed initial rules
- Modes: Friendship and Couple.
- Categories: Funny, Getting to Know, Sweet/Romantic, Deep Talk; no explicit or dangerous dares in the first packs.
- Current player can pick Truth or Dare; the app chooses a prompt.
- Each player can skip without penalty; show a skip counter only if the group enables it.
- Never require sharing passwords, private images, location, financial information, or any other sensitive information.
- Custom question packs are a later milestone; private by default and never made public automatically.

### Tic Tac Toe
- Two players, alternating turns, one mark per empty cell.
- Reject moves out of turn or into occupied cells.
- Detect win/draw on the authoritative state.
- Rematch requires both players or host-started new round according to an explicit lobby rule.

### Chess
- Standard chess rules; no chess AI required for first release.
- Every attempted move is validated against the current authoritative position.
- A move is accepted only for the player whose turn it is and only when the state version is current.

### Ludo — proposed default preset (confirm in implementation checklist)
- Four tokens per player; support 2–4 players.
- A token leaves the yard on a six.
- A six grants an extra roll.
- Capturing on an unsafe square sends the opponent token to its yard; capture grants an extra roll.
- Safe squares cannot be captured.
- Exact roll required to move a token to the finish.
- Three consecutive sixes end that player’s turn without applying the third move.
- The board path, safe squares, home lanes, and edge cases must be encoded in data/rule tests, not scattered across UI components.

**Note:** Ludo rules vary between apps. Treat this as our proposed house-rule preset and do not silently alter it after testing begins.

## 10. Room and player policy (initial proposal)

- Private invite-only rooms; no public matchmaking initially.
- Guest display names to lower friction; account sign-in can be added later only if needed.
- Suggested caps: Chess 2; Tic Tac Toe 2; Ludo 2–4; party games 2–8.
- Generate high-entropy room identifiers; any short human-readable code must have rate limits and abuse protection.
- Host can start, close, or return the room to lobby. Host transfer should be deterministic if the host disconnects/leaves.
- Proposed reconnect grace period: 120 seconds, configurable after tests.
- Disconnected seats remain reserved during the grace window; duplicate sessions must not control the same seat concurrently.
- Room lifecycle: waiting → active → finished/abandoned → expired/cleaned up.
- Propose automatic cleanup of old inactive rooms, with the actual expiry scheduled and implemented explicitly.

## 11. Proposed technology

- **Frontend:** React + TypeScript + Vite.
- **UI:** CSS design tokens and reusable responsive components; Tailwind optional only if it simplifies rather than complicates the build.
- **Backend/data:** Supabase Postgres.
- **Realtime:** Supabase Broadcast for game events; Presence for slow-changing online/ready state only.
- **Trusted validation:** server-side/Edge Function and/or atomic database RPC pattern for permission checks, turn checks, game-rule validation, expected-state-version checks, and durable state updates. The exact move pipeline must be prototyped before building full games.
- **Chess rules:** `chess.js`, validated on the trusted side.
- **Hosting:** Cloudflare Pages for static frontend; Supabase Free for backend during private/friend testing, subject to limits.
- **Version control:** GitHub repository; use feature branches or small, reversible commits.
- **Testing:** Vitest for game logic/unit tests; Playwright for browser/end-to-end tests where practical; manual real-device multiplayer checklist.

This is a recommended stack, not yet a deployed system. It must be verified with a small room-sync proof of concept before major implementation.

## 12. Multiplayer state architecture requirements

1. Persist the authoritative room/game state in Postgres.
2. Each player action is a command, not a client-supplied final game state.
3. Server/trusted code validates: room membership, seat identity, correct turn, legal move, phase/status, input shape, and expected state version.
4. Commit accepted moves atomically, increment a monotonically increasing `state_version`, and reject stale/duplicate commands safely.
5. Broadcast the accepted state/event after the durable commit. Clients re-fetch/resync authoritative state after reconnect or version gaps.
6. Never place a Supabase secret/service-role key in frontend code or a checked-in file. Frontend receives only the intended public/publishable key.
7. Apply Row Level Security and least-privilege access. Private room reads/writes must be authorized on the backend, not only hidden by the UI.
8. Add rate limits to room creation/join attempts and prompt submission where possible.
9. Never broadcast private custom prompts/answers to people who should not see them; decide in the game model whether prompts are public or private before implementation.
10. Presence should not be called on every roll/move/animation frame; it has documented rate limits.

## 13. UI and accessibility rules

- Design for 360 px width first; test common Android Chrome sizes.
- Body text target 14–16 px, secondary text usually 12–14 px; avoid tiny labels.
- Touch controls target at least about 44 × 44 CSS pixels.
- Show turn owner, room status, offline/reconnecting state, and whose move is pending clearly.
- Do not communicate game outcome by color alone; include text/icons.
- Provide loading, empty, error, reconnecting, full-room, invalid-code, and finished states.
- Avoid excessive gradients, borders, shadows, stacked cards, and decorative animation that slows gameplay.
- Animations may illustrate an already-accepted server move; they must not decide or commit the move.

## 14. Quality gates and definition of done

A phase is not done because the screen “looks right.” It is done only when its checklist is green and a release checkpoint has been recorded.

### Required checks for every milestone
- TypeScript typecheck passes.
- Lint passes (if configured).
- Unit tests pass.
- Build succeeds.
- No console-breaking errors in key flows.
- Desktop and mobile smoke test passes.
- Existing completed features still work (regression test).
- Known limitations are written down; no claimed test is left unrun.

### Multiplayer test matrix
- Two separate devices/browser profiles join the same room.
- Both see the same lobby players, current turn, moves, and final result.
- Two simultaneous/conflicting move attempts: only one valid command is applied.
- Out-of-turn, illegal, malformed, duplicate, stale-version, and non-member commands are rejected.
- Refresh/reconnect restores authoritative state without duplicate moves.
- Host leaves/disconnects; deterministic recovery works.
- Room full, invalid code, expired room, and network interruption show helpful messages.
- Test slow or intermittent connections and repeated taps.
- Test at least Android Chrome and a desktop browser; test iPhone Safari if a device is available.

### Release status labels
- **Planned:** spec only.
- **In progress:** code exists, not fully tested.
- **Implemented:** feature code exists; tests still may be pending.
- **Verified:** listed tests passed with evidence.
- **Blocked:** external credential, account setup, or provider issue prevents testing.

## 15. Free plan/cost policy

- Target cost is ₹0 for the private friend-testing stage.
- No paid add-ons, domain purchase, ads, or monetization without explicit decision.
- Free quotas can change and are not unlimited. Recheck current Supabase and Cloudflare plans before setup and public sharing.
- Supabase Free published limits currently include 200 peak realtime connections, 2 million realtime messages, 500 MB database per project, 1 GB storage and 5 GB egress; check the live plan page for the current definition and any changes.
- The static Pages asset allowance is different from Pages Functions/Workers request quotas; avoid functions unless the backend needs them.
- If the usage nears quota, first optimize and show the limit clearly; do not silently add paid services.

## 16. Phases and deliverables

### Phase 00 — Research and master specification
- **Status:** Complete as a planning baseline (Version 0.2 updates the name and complete proposed catalogue).
- Deliverable: this file plus copy-paste handoff note.

### Phase 01 — Repository inspection and frontend shell
- Inspect the intended repository first; if none is selected, establish a clean new repository. Do not overwrite a project blindly.
- Build responsive home, game categories (Board / Friends / Couples), game cards, create/join room, lobby, and settings shell using mock data only where clearly labelled.
- Acceptance: typecheck/lint/build pass; navigation and empty/loading/error states work; mobile screens fit; no fake claim that multiplayer is already connected.

### Phase 02 — Backend proof of concept
- Configure Supabase, schema, access rules/RLS, room creation/join, player membership, and accepted/rejected room events.
- Prove two separate devices can join, sync, disconnect, and resync before implementing full game state.
- Acceptance: repeatable two-device checklist passes; no secret service-role key in frontend.

### Phase 03 — First playable prototype
- Implement Tic Tac Toe plus the shared prompt/vote framework.
- Add Truth or Dare (Friends + Couples), Would You Rather (Friends + Couples), and How Well Do You Know Me (Friend + Couple packs).
- Acceptance: unit tests, two-client E2E tests, skip/private-answer handling, turn/round sequencing, and reconnect behavior pass.

### Phase 04 — Chess
- Integrate `chess.js` through trusted move validation; test castling, en passant, promotion, check/checkmate, draws, stale moves, and reconnect.
- Acceptance: legal/illegal move cases and multiplayer test matrix pass.

### Phase 05 — Ludo
- Implement the documented rule preset as a pure/testable engine first, then UI and sync.
- Acceptance: every documented rule/edge case has unit coverage, plus two-to-four-player multiplayer tests.

### Phase 06 — Party/couple catalogue completion
- Add Never Have I Ever, Most Likely To, Couples This or That, Our Story Quiz, Date Night Spinner, and prompt pack polish.
- Acceptance: same prompt/round state appears consistently for everyone; private answers remain private until reveal; skip works in every round.

### Phase 07 — Expansion and release QA
- Add Connect Four, Snakes & Ladders, Guess the Word/Who Am I, and custom question packs only after core release quality gates pass.
- Run regression, security, accessibility, performance, live-host smoke tests; write known limits and rollback instructions.
- Acceptance: tests pass, release checklist has evidence, and changelog/status notes are updated.

## 17. Decisions still open

- Repository name/URL and which GitHub repo will be used.
- Supabase project/account setup and deployment ownership.
- Exact visual style after a wireframe review.
- Guest identity implementation (anonymous Supabase Auth vs server-issued guest session).
- Host-transfer and room-expiry policy.
- Whether all party answers are public after reveal or some prompts support private answers.
- Whether the proposed third-consecutive-six rule is adjustable for Ludo.
- YaarJam domain, social handle, and trademark clearance (required before public branding).

Do not block Phase 01 on optional social features; resolve only decisions needed for the next phase.

## 18. Research links (checked 15 October 2026)

- Plato game catalogue (50+ titles): https://platoapp.com/en/games
- Plato cross-platform/multiplayer overview: https://platoapp.com/en/download
- Would You Rather? Party Games listing (private rooms, couples categories, custom questions, Never Have I Ever): https://play.google.com/store/apps/details?hl=en_IN&id=com.dreamlabentertainment.wouldyourather
- Couple game comparison (2026; note publisher conflict in the article): https://couplemissions.com/blog/best-truth-or-dare-apps-for-couples
- Browser Chess + Ludo/private-room example: https://multiboard.live/
- Existing PlayAdda app listing: https://play.google.com/store/apps/details?id=com.playadda.app
- Existing GameYaar online presence: https://t.me/gameyaar
- Existing playMingle multiplayer party site: https://www.playmingle.tw/
- Indian Trademark Public Search: https://tmrsearch.ipindia.gov.in/tmrpublicsearch
- IP India guide to searching existing trademarks: https://www.ipindia.gov.in/trade-marks-before-you-apply-search-existing-trademarks
- Supabase Realtime getting started: https://supabase.com/docs/guides/realtime/getting_started
- Supabase Broadcast: https://supabase.com/docs/guides/realtime/broadcast
- Supabase Presence: https://supabase.com/docs/guides/realtime/presence
- Supabase Realtime limits: https://supabase.com/docs/guides/realtime/limits
- Supabase current plan allowance/billing details: https://supabase.com/docs/guides/platform/billing-on-supabase
- Cloudflare Pages Functions pricing/quotas: https://developers.cloudflare.com/pages/functions/pricing/
- chess.js official repository: https://github.com/jhlywa/chess.js/
- OWASP Authorization Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html
- OWASP HTML5 Security Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/HTML5_Security_Cheat_Sheet.html

## Phase 03 implementation status — 15 October 2026

Phase 01/02 implementation exists in the source package. Phase 03 adds the first game loop, Tic Tac Toe, but does not mean the full catalogue is ready.

- **Playable demo:** local pass-and-play on the same device, clearly labelled as demo-only.
- **Online game source:** when Supabase is configured, a Tic Tac Toe room initializes after players join; each device sees the board, turn, winner/draw state and rematch requests through Supabase realtime.
- **Trusted validation:** PostgreSQL functions enforce room membership, active room status/expiry, player assignment, turn ownership, move range, occupied cells, end-of-round checks, win/draw and dual-consent rematch.
- **Leave/rejoin behavior:** if a player leaves a Tic Tac Toe room mid-match, the game is reset to waiting for the remaining player so a new guest can join; X/O roles are re-assigned in join order.
- **SQL files:** run `supabase/schema.sql` on a fresh project. For a project that already ran Phase 02, run only `supabase/phase_03_tic_tac_toe.sql`.
- **Automated test source:** `src/lib/tic-tac-toe.test.ts` contains ten Vitest cases. The pure rule module was compiled independently and twelve rule-level checks passed.
- **Not verified:** npm install timed out against the registry; full Vitest/Vite build, live SQL/RLS verification and two-phone online test have not passed or been claimed.
- **Still planned:** Chess, Ludo, Truth or Dare, couple quizzes, other game loops, chat, profiles, rate limiting and broader release hardening.

## Current copy-paste handoff note

**Project:** YaarJam — “Apne log. Apna game.” (working name; domain/trademark not cleared).  
**Current phase:** Phase 03 — first playable game.  
**Completed in source:** mobile-first catalogue and Supabase room foundation retained; local Tic Tac Toe pass-and-play; Supabase-backed game state, server-side move/win/draw validation, realtime refresh, two-player rematch consent, X/O swap, and reset if someone leaves mid-match.  
**Test evidence:** all TS/TSX files passed syntax transpilation; standalone TypeScript compilation of game rules passed; 12 independent rule tests passed. Ten Vitest tests are included but Vitest was not run because npm dependency installation timed out.  
**Not completed/verified:** full build, SQL execution, GitHub Actions run, real two-phone play.  
**Next:** run npm install/test/build from a network-enabled environment, apply the appropriate SQL file, deploy, and verify a full online match and rematch on two phones. Fix failures before adding the next game.  
**Keep following:** small phases, preserve working features, update `CURRENT_STATUS.md`, `BUGS.md`, `TEST_PLAN.md`, `CHANGELOG.md`, and this note every step.
