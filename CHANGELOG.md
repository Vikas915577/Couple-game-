# Changelog

## 0.3.0 — Phase 03: Tic Tac Toe

- Added playable local demo Tic Tac Toe, clearly labelled as same-device only.
- Added online game-state service and Supabase RPC calls for game initialization, validated moves and cooperative rematch.
- Added `tic_tac_toe_games` with row-level security and realtime publication setup.
- Added server-side validation for membership, turn, move index, occupied cells, game state and room expiry.
- Added win/draw detection in database, winning-line UI highlight, live status and X/O player labels.
- Rematch now requires both players; roles swap when the next round begins.
- Added 10 Vitest cases for pure rule helpers; 12 independent rules checks run directly against the compiled rule module passed.
- Updated project status, QA plan, docs and room/game status copy.
- Full Vitest/Vite build and live Supabase/two-device QA remain unverified because npm registry access timed out and no user Supabase project is configured.

## 0.2.0 — Phase 02: secure rooms

- Added Supabase client and anonymous guest sessions.
- Added room create/join/leave RPC integration and realtime lobby subscriptions.
- Added SQL schema, RLS, private membership checks, and room host transfer logic.
- Added invite-link handling, room player list, and demo fallback when backend values are missing.
- Added GitHub Pages workflow that runs tests and build before deployment.
- Room code validation supports 6–8 characters.

## 0.1.0 — Phase 01 frontend prototype

- Added the mobile-first shell, categories, catalogue, room modal preview, search/filter UI, and project notes.
