import { requireSupabase } from './supabase';
import { normalizeBoard, type TicTacToeState, type TicTacToeStatus } from './tic-tac-toe';

interface RawTicTacToeState extends Omit<TicTacToeState, 'board' | 'status'> {
  board: unknown;
  status: string;
}

function normalizeState(value: unknown): TicTacToeState {
  const raw = value as RawTicTacToeState | null;
  if (!raw || typeof raw.room_id !== 'string') {
    throw new Error('Game state was not returned by Supabase. Check `supabase/schema.sql` and run `supabase/tests/v1_verification.sql`.');
  }
  const allowed: TicTacToeStatus[] = ['waiting', 'playing', 'x_won', 'o_won', 'draw'];
  if (!allowed.includes(raw.status as TicTacToeStatus)) throw new Error('The server returned an unknown game status.');
  return { ...raw, board: normalizeBoard(raw.board), status: raw.status as TicTacToeStatus };
}

export async function startOrLoadTicTacToe(roomId: string): Promise<TicTacToeState> {
  const client = requireSupabase();
  const { data, error } = await client.rpc('start_ttt_game', { p_room_id: roomId });
  if (error) throw new Error(error.message);
  return normalizeState(data);
}

export async function loadTicTacToe(roomId: string): Promise<TicTacToeState> {
  const client = requireSupabase();
  const { data, error } = await client
    .from('tic_tac_toe_games')
    .select('room_id, board, status, x_user_id, o_user_id, current_turn_user_id, winner_user_id, x_rematch_ready, o_rematch_ready, updated_at')
    .eq('room_id', roomId)
    .single();
  if (error) throw new Error(error.message);
  return normalizeState(data);
}

export async function submitTicTacToeMove(roomId: string, cell: number): Promise<TicTacToeState> {
  const client = requireSupabase();
  const { data, error } = await client.rpc('play_ttt_move', { p_room_id: roomId, p_cell: cell });
  if (error) throw new Error(error.message);
  return normalizeState(data);
}

export async function requestTicTacToeRematch(roomId: string): Promise<TicTacToeState> {
  const client = requireSupabase();
  const { data, error } = await client.rpc('request_ttt_rematch', { p_room_id: roomId });
  if (error) throw new Error(error.message);
  return normalizeState(data);
}

export function subscribeToTicTacToe(
  roomId: string,
  onChange: () => void,
  onError?: (message: string) => void,
) {
  const client = requireSupabase();
  return client
    .channel(`tic-tac-toe:${roomId}`)
    .on('postgres_changes', {
      event: '*', schema: 'public', table: 'tic_tac_toe_games', filter: `room_id=eq.${roomId}`,
    }, onChange)
    .subscribe((status, error) => {
      if (status === 'SUBSCRIBED') {
        // Re-fetch after the channel is ready so a move made during connection setup is not missed.
        onChange();
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        onError?.(error?.message ?? `Game sync status: ${status}`);
      }
    });
}

export async function removeTicTacToeSubscription(channel: ReturnType<typeof subscribeToTicTacToe>) {
  await requireSupabase().removeChannel(channel);
}
