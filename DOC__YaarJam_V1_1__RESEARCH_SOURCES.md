# Product / technical research notes for V1.1

1. Supabase Realtime Broadcast: https://supabase.com/docs/guides/realtime/broadcast — low-latency room communication.
2. Supabase Realtime Authorization: https://supabase.com/docs/guides/realtime/authorization — private-channel permissions should be governed with RLS; don't expose a room chat to the public.
3. Supabase database changes: https://supabase.com/docs/guides/realtime/subscribing-to-database-changes — Broadcast is the more scalable recommendation; this MVP uses Postgres Changes for message/game-state rows and scopes SELECT with room-membership RLS.
4. Tic Tac Toe minimax explanation: https://tictoe.org/blog/minimax-algorithm-explained — exhaustive search makes a correct hard opponent unlosable; a perfect opponent can be drawn against.
5. Mature prompt-pack category patterns: https://apps.apple.com/us/app/truth-or-dare-couple-game/id6746060726 and https://play.google.com/store/apps/details?id=com.ammoru.truthordare — layered tone/heat packs are a useful discoverability pattern. YaarJam's mature prompts remain non-graphic and include explicit skip/comfort language.

Implementation decisions:
- Start with text chat, not voice; voice needs a separately tested WebRTC layer.
- Expose playable status honestly: local party game modes are not described as online synced.
- Online Ludo game state changes use database RPCs and membership checks rather than trusting a client-posted final board.
