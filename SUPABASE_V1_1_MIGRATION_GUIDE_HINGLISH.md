# Supabase V1.1 migration — simple phone steps

**Kab karna hai:** GitHub Actions se V1.1 website build/deploy green hone ke baad.

1. Open: https://supabase.com/dashboard/project/gvwmisqnepdlejhvacbm/sql/new
2. This project must be **Vikas915577's Project** (`gvwmisqnepdlejhvacbm`), not Winter Arc.
3. Open `supabase/v1_1_social_and_adult_packs.sql` from the downloaded ZIP and copy its full contents.
4. Paste into Supabase SQL Editor and tap **Run** once.
5. Ensure the result shows success. If SQL Editor shows any error, stop and share the exact error; don't repeatedly run partial selections.
6. Return to the website and test the room chat, online Ludo with two phones first, then three/four players, and online couples pack selection.

This is an upgrade migration for the existing V1 schema. Do not paste the whole original `schema.sql` again.

## Safety
- It does not require a service-role key in the website.
- Chat reads are room-member-only; message inserts must go through `send_room_message`.
- Ludo dice and moves are handled by Supabase RPCs, not accepted as a client-supplied final state.
- After Dark/Spicy packs should only be used by consenting adults. Anyone can pass/skip a prompt without pressure.
