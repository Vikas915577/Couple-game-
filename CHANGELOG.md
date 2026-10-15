# Changelog

## 0.2.0 — Phase 02 source

- Added Supabase client and anonymous guest sessions.
- Added room create/join/leave RPC integration and realtime lobby subscriptions.
- Added SQL schema, RLS, private membership checks, and room host transfer logic.
- Added invite-link handling, room player list, and demo fallback when backend values are missing.
- Added GitHub Pages workflow that runs tests and build before deployment.
- Updated room code validation to 6–8 characters to match the SQL schema.
- Set dependency ranges to Supabase JS `^2.117.3` and Vite `^6.4.4` for the current Phase 02 package baseline.
- Filtered closed/expired rooms from the saved active-room list and improved missing game-ID validation in the room-creation RPC.
- Fixed a strict TypeScript inference issue when restoring a saved online room.
- Re-ran source syntax, CSS parser, workflow/JSON, secret scan and catalogue smoke checks; dependency install remains blocked by npm registry DNS.
- Not yet live-verified: user must configure Supabase and run the schema; the authoring container could not resolve the npm registry.

## 0.1.0 — Phase 01 frontend prototype

- Added the mobile-first shell, categories, catalogue, room modal preview, search/filter UI, and project notes.
