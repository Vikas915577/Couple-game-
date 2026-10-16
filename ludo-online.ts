import { requireSupabase } from './supabase';
import type { LudoColor, LudoPlayer, LudoState } from './ludo';

const colors = new Set<LudoColor>(['red', 'blue', 'green', 'yellow']);

export function normalizeOnlineLudo(value: unknown): LudoState {
  if (!value || typeof value !== 'object') throw new Error('Ludo state is missing. Ask the room host to start the match.');
  const raw = value as Partial<LudoState>;
  if (!Array.isArray(raw.players) || raw.players.length < 2 || raw.players.length > 4) throw new Error('Invalid Ludo player list returned by Supabase.');
  const players: LudoPlayer[] = raw.players.map((rawPlayer) => {
    const player = rawPlayer as Partial<LudoPlayer>;
    if (typeof player.id !== 'string' || typeof player.name !== 'string' || !player.color || !colors.has(player.color) || !Array.isArray(player.tokens) || player.tokens.length !== 4) {
      throw new Error('Invalid Ludo player state returned by Supabase.');
    }
    const tokens = player.tokens.map((progress) => Number(progress));
    if (tokens.some((progress) => !Number.isInteger(progress) || progress < -1 || progress > 58)) throw new Error('Invalid Ludo token position returned by Supabase.');
    return { id: player.id, name: player.name.slice(0, 18), color: player.color, isComputer: false, tokens };
  });
  const currentPlayerIndex = Number(raw.currentPlayerIndex);
  const die = raw.die === null || raw.die === undefined ? null : Number(raw.die);
  const legalTokenIndices = Array.isArray(raw.legalTokenIndices) ? raw.legalTokenIndices.map(Number).filter((v) => Number.isInteger(v) && v >= 0 && v <= 3) : [];
  if (!Number.isInteger(currentPlayerIndex) || currentPlayerIndex < 0 || currentPlayerIndex >= players.length) throw new Error('Invalid current Ludo turn returned by Supabase.');
  if (die !== null && (!Number.isInteger(die) || die < 1 || die > 6)) throw new Error('Invalid Ludo dice result returned by Supabase.');
  if (typeof raw.rolled !== 'boolean' || typeof raw.turnNumber !== 'number' || typeof raw.message !== 'string') throw new Error('Incomplete Ludo state returned by Supabase.');
  return {
    players,
    currentPlayerIndex,
    die,
    rolled: raw.rolled,
    legalTokenIndices,
    winnerId: typeof raw.winnerId === 'string' ? raw.winnerId : null,
    message: raw.message.slice(0, 240),
    turnNumber: Math.max(1, Math.floor(raw.turnNumber)),
  };
}

export async function loadOnlineLudo(roomId: string): Promise<LudoState | null> {
  const { data, error } = await requireSupabase().from('ludo_games').select('game_state').eq('room_id', roomId).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? normalizeOnlineLudo(data.game_state) : null;
}

export async function startOnlineLudo(roomId: string): Promise<LudoState> {
  const { data, error } = await requireSupabase().rpc('start_ludo', { p_room_id: roomId });
  if (error) throw new Error(error.message);
  return normalizeOnlineLudo(data);
}

export async function resetOnlineLudo(roomId: string): Promise<LudoState> {
  const { data, error } = await requireSupabase().rpc('reset_ludo', { p_room_id: roomId });
  if (error) throw new Error(error.message);
  return normalizeOnlineLudo(data);
}

export async function rollOnlineLudoDie(roomId: string): Promise<LudoState> {
  const { data, error } = await requireSupabase().rpc('play_ludo_action', { p_room_id: roomId, p_action: 'roll', p_token_index: null });
  if (error) throw new Error(error.message);
  return normalizeOnlineLudo(data);
}

export async function moveOnlineLudoToken(roomId: string, tokenIndex: number): Promise<LudoState> {
  const { data, error } = await requireSupabase().rpc('play_ludo_action', { p_room_id: roomId, p_action: 'move', p_token_index: tokenIndex });
  if (error) throw new Error(error.message);
  return normalizeOnlineLudo(data);
}

export function subscribeToOnlineLudo(roomId: string, onChange: () => void, onError?: (message: string) => void) {
  return requireSupabase().channel(`ludo-game:${roomId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'ludo_games', filter: `room_id=eq.${roomId}` }, onChange)
    .subscribe((status, error) => {
      if (status === 'SUBSCRIBED') onChange();
      else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') onError?.(error?.message ?? `Ludo sync status: ${status}`);
    });
}

export async function removeOnlineLudoSubscription(channel: ReturnType<typeof subscribeToOnlineLudo>) {
  await requireSupabase().removeChannel(channel);
}
