import { requireSupabase } from './supabase';
import type { DareMode, PromptKind, PromptPack } from './truth-or-dare';

export interface OnlineTruthOrDareState {
  room_id: string;
  mode: DareMode;
  player_order: string[];
  current_turn_index: number;
  current_turn_user_id: string | null;
  current_prompt_id: string | null;
  current_prompt_kind: PromptKind | null;
  current_prompt_text: string | null;
  used_prompt_ids: string[];
  completed_count: number;
  skipped_count: number;
  updated_at: string;
}

function asStringArray(value: unknown, field: string): string[] {
  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string')) {
    throw new Error(`Supabase returned invalid ${field}. Check supabase/schema.sql and run supabase/tests/v1_verification.sql.`);
  }
  return value as string[];
}

export function normalizeOnlineTruthOrDare(value: unknown): OnlineTruthOrDareState {
  const raw = value as Partial<OnlineTruthOrDareState> | null;
  if (!raw || typeof raw.room_id !== 'string') {
    throw new Error('Truth or Dare state was not returned. Run supabase/schema.sql for a fresh V1 database.');
  }
  if (raw.mode !== 'friends' && raw.mode !== 'couples') throw new Error('Unknown Truth or Dare mode returned by Supabase.');
  if (raw.current_prompt_kind !== null && raw.current_prompt_kind !== undefined && raw.current_prompt_kind !== 'truth' && raw.current_prompt_kind !== 'dare') {
    throw new Error('Unknown prompt kind returned by Supabase.');
  }
  if (!Number.isInteger(raw.current_turn_index) || (raw.current_turn_index ?? -1) < 0) {
    throw new Error('Invalid current turn returned by Supabase.');
  }
  if (!Number.isInteger(raw.completed_count) || (raw.completed_count ?? -1) < 0 || !Number.isInteger(raw.skipped_count) || (raw.skipped_count ?? -1) < 0) {
    throw new Error('Invalid Truth or Dare counters returned by Supabase.');
  }
  const promptId = raw.current_prompt_id ?? null;
  const promptKind = raw.current_prompt_kind ?? null;
  const promptText = raw.current_prompt_text ?? null;
  if ((promptId === null) !== (promptKind === null) || (promptId === null) !== (promptText === null)) {
    throw new Error('Inconsistent active prompt returned by Supabase. Refresh after checking the YaarJam V1 SQL setup.');
  }
  return {
    room_id: raw.room_id,
    mode: raw.mode,
    player_order: asStringArray(raw.player_order, 'player order'),
    current_turn_index: raw.current_turn_index as number,
    current_turn_user_id: raw.current_turn_user_id ?? null,
    current_prompt_id: promptId,
    current_prompt_kind: promptKind as PromptKind | null,
    current_prompt_text: promptText as string | null,
    used_prompt_ids: asStringArray(raw.used_prompt_ids, 'used prompt list'),
    completed_count: raw.completed_count as number,
    skipped_count: raw.skipped_count as number,
    updated_at: typeof raw.updated_at === 'string' ? raw.updated_at : '',
  };
}

async function callStateRpc(name: 'start_truth_or_dare' | 'choose_truth_or_dare' | 'resolve_truth_or_dare', args: Record<string, unknown>) {
  const { data, error } = await requireSupabase().rpc(name, args);
  if (error) throw new Error(error.message);
  return normalizeOnlineTruthOrDare(data);
}

export function startOrLoadTruthOrDare(roomId: string): Promise<OnlineTruthOrDareState> {
  return callStateRpc('start_truth_or_dare', { p_room_id: roomId });
}

export function loadTruthOrDare(roomId: string): Promise<OnlineTruthOrDareState> {
  return (async () => {
    const { data, error } = await requireSupabase()
      .from('truth_or_dare_games')
      .select('room_id, mode, player_order, current_turn_index, current_turn_user_id, current_prompt_id, current_prompt_kind, current_prompt_text, used_prompt_ids, completed_count, skipped_count, updated_at')
      .eq('room_id', roomId)
      .single();
    if (error) throw new Error(error.message);
    return normalizeOnlineTruthOrDare(data);
  })();
}

export function chooseOnlineTruthOrDare(roomId: string, kind: PromptKind, pack: PromptPack = 'classic'): Promise<OnlineTruthOrDareState> {
  // Keep the original two-argument RPC call for the Classic pack so V1 stays usable
  // until the V1.1 Supabase migration is applied. Non-classic packs require that migration.
  const args = pack === 'classic'
    ? { p_room_id: roomId, p_kind: kind }
    : { p_room_id: roomId, p_kind: kind, p_pack: pack };
  return callStateRpc('choose_truth_or_dare', args);
}

export function resolveOnlineTruthOrDare(roomId: string, skipped: boolean): Promise<OnlineTruthOrDareState> {
  return callStateRpc('resolve_truth_or_dare', { p_room_id: roomId, p_skipped: skipped });
}

export function subscribeToTruthOrDare(
  roomId: string,
  onChange: () => void,
  onError?: (message: string) => void,
) {
  return requireSupabase()
    .channel(`truth-or-dare:${roomId}`)
    .on('postgres_changes', {
      event: '*', schema: 'public', table: 'truth_or_dare_games', filter: `room_id=eq.${roomId}`,
    }, onChange)
    .subscribe((status, error) => {
      if (status === 'SUBSCRIBED') {
        // Re-fetch immediately after subscribing so a state update during setup is not missed.
        onChange();
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        onError?.(error?.message ?? `Truth or Dare sync status: ${status}`);
      }
    });
}

export async function removeTruthOrDareSubscription(channel: ReturnType<typeof subscribeToTruthOrDare>) {
  await requireSupabase().removeChannel(channel);
}
