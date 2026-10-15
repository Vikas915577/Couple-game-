import { requireSupabase } from './supabase';

export interface OnlineRoom {
  id: string;
  code: string;
  room_name: string;
  game_id: string;
  host_user_id: string;
  max_players: number;
  status: 'open' | 'closed';
  created_at: string;
  expires_at: string;
}

export interface OnlinePlayer {
  id: string;
  room_id: string;
  user_id: string;
  display_name: string;
  joined_at: string;
}

export interface OnlineRoomState {
  room: OnlineRoom;
  players: OnlinePlayer[];
}

let guestSessionPromise: Promise<string> | null = null;

export function ensureGuestSession(): Promise<string> {
  if (guestSessionPromise) return guestSessionPromise;

  const pending = (async () => {
    const client = requireSupabase();
    const { data: sessionData, error: sessionError } = await client.auth.getSession();
    if (sessionError) throw sessionError;
    if (sessionData.session?.user) return sessionData.session.user.id;

    const { data, error } = await client.auth.signInAnonymously();
    if (error) {
      throw new Error(
        `Could not start a guest session: ${error.message}. In Supabase Dashboard, enable Anonymous Sign-Ins under Authentication settings.`,
      );
    }
    if (!data.user) throw new Error('Supabase did not return a guest user. Please refresh and try again.');
    return data.user.id;
  })().catch((error: unknown) => {
    guestSessionPromise = null;
    throw error;
  });

  guestSessionPromise = pending;
  return pending;
}

export async function createOnlineRoom(input: {
  roomName: string;
  gameId: string;
  displayName: string;
  maxPlayers: number;
}): Promise<OnlineRoomState> {
  const client = requireSupabase();
  await ensureGuestSession();
  const { data, error } = await client.rpc('create_room', {
    p_room_name: input.roomName.trim(),
    p_game_id: input.gameId,
    p_display_name: input.displayName.trim(),
    p_max_players: input.maxPlayers,
  });
  if (error) throw new Error(error.message);
  const created = data as unknown as OnlineRoom;
  if (!created?.id) throw new Error('Room was created, but its details could not be read. Check the SQL setup and try again.');
  return loadOnlineRoom(created.id);
}

export async function joinOnlineRoom(code: string, displayName: string): Promise<OnlineRoomState> {
  const client = requireSupabase();
  await ensureGuestSession();
  const { data, error } = await client.rpc('join_room', {
    p_code: code.trim().toUpperCase(),
    p_display_name: displayName.trim(),
  });
  if (error) throw new Error(error.message);
  const joined = data as unknown as OnlineRoom;
  if (!joined?.id) throw new Error('Room joined, but its details could not be read. Check the SQL setup and try again.');
  return loadOnlineRoom(joined.id);
}

export async function loadOnlineRoom(roomId: string): Promise<OnlineRoomState> {
  const client = requireSupabase();
  const [roomResult, playersResult] = await Promise.all([
    client
      .from('rooms')
      .select('id, code, room_name, game_id, host_user_id, max_players, status, created_at, expires_at')
      .eq('id', roomId)
      .single(),
    client
      .from('room_players')
      .select('id, room_id, user_id, display_name, joined_at')
      .eq('room_id', roomId)
      .order('joined_at', { ascending: true }),
  ]);
  if (roomResult.error) throw new Error(roomResult.error.message);
  if (playersResult.error) throw new Error(playersResult.error.message);
  return {
    room: roomResult.data as OnlineRoom,
    players: (playersResult.data ?? []) as OnlinePlayer[],
  };
}

export async function listMyOnlineRooms(userId: string): Promise<OnlineRoomState[]> {
  const client = requireSupabase();
  const { data, error } = await client
    .from('room_players')
    .select('room_id')
    .eq('user_id', userId);
  if (error) throw new Error(error.message);

  const memberships = (data ?? []) as unknown as Array<{ room_id: string }>;
  const roomIds: string[] = [...new Set<string>(memberships.map((row) => row.room_id))];
  const results = await Promise.all(roomIds.map((id) => loadOnlineRoom(id).catch(() => null)));
  return results.filter(
    (state): state is OnlineRoomState =>
      state !== null && state.room.status === 'open' && Date.parse(state.room.expires_at) > Date.now(),
  );
}

export async function leaveOnlineRoom(roomId: string): Promise<void> {
  const client = requireSupabase();
  const { error } = await client.rpc('leave_room', { p_room_id: roomId });
  if (error) throw new Error(error.message);
}

export function subscribeToRoom(
  roomId: string,
  onChange: () => void,
  onError?: (message: string) => void,
) {
  const client = requireSupabase();
  return client
    .channel(`room:${roomId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'room_players', filter: `room_id=eq.${roomId}` },
      () => onChange(),
    )
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `id=eq.${roomId}` },
      () => onChange(),
    )
    .subscribe((status, error) => {
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        onError?.(error?.message ?? `Realtime subscription status: ${status}`);
      }
    });
}

export async function removeRoomSubscription(channel: ReturnType<typeof subscribeToRoom>) {
  const client = requireSupabase();
  await client.removeChannel(channel);
}
