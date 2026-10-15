# YaarJam Phase 02 — Test Plan

## Automated checks

Run `npm test` and `npm run build`. GitHub Actions runs these before deployment. Source-level syntax, CSS parsing, a supplemental strict-null/no-unused internal typecheck with dependency stubs, and catalogue smoke checks passed during package preparation; dependency-backed tests/build remain pending because this environment cannot resolve `registry.npmjs.org`.

## Demo-mode checks (no Supabase keys)

- [ ] Site opens and navigation works on phone and desktop sizes.
- [ ] Search and each category filter work.
- [ ] Create a demo room and copy its room code.
- [ ] Demo room is labelled as local-only; app does not claim that another device can join it.
- [ ] Try joining its code in the same browser; the app explains that this is still a demo.
- [ ] No frontend exception appears in browser console during the above steps.

## Supabase setup checks

- [ ] `supabase/schema.sql` runs successfully in Supabase SQL Editor.
- [ ] Anonymous Sign-Ins is enabled.
- [ ] Set Project URL and publishable/anon key using `.env.local` or GitHub Actions repository secrets.
- [ ] App's top badge changes to `LIVE ROOMS` after a guest session starts.
- [ ] Create a room with a 1–36 character room name and 1–18 character display name.
- [ ] Second device can join using the 6–8 character code.
- [ ] Both devices show the same players after joining; add/remove a player and confirm the list updates.
- [ ] Wrong code, room capacity reached, duplicate display name, closed room and expired room show a readable error.
- [ ] Leaving as a non-host only removes that player.
- [ ] When host leaves, the oldest remaining player becomes host; when final player leaves, room closes.
- [ ] Non-member cannot query a room/player list through the Supabase Data API due to RLS.
- [ ] Inspect browser bundle and repository: no service-role/secret key is present.
- [ ] Refresh / reopen an invite link and confirm expected join behavior.

## Still beyond this phase

- [ ] Game-round logic and synchronized moves.
- [ ] Cross-browser reconnect race testing and load/rate-limit testing.
- [ ] Production security review of RPCs/RLS and abuse protections.

## Release criteria

Do not call this phase fully verified until automated tests and production build pass, SQL is applied without errors, and two separate devices successfully create/join the same lobby.
