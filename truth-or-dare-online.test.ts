import { describe, expect, it } from 'vitest';
import { normalizeOnlineTruthOrDare } from './truth-or-dare-online';

const validState = {
  room_id: 'room-123',
  mode: 'friends',
  player_order: ['player-a', 'player-b'],
  current_turn_index: 0,
  current_turn_user_id: 'player-a',
  current_prompt_id: null,
  current_prompt_kind: null,
  current_prompt_text: null,
  used_prompt_ids: [],
  completed_count: 0,
  skipped_count: 0,
  updated_at: '2026-10-15T00:00:00Z',
};

describe('online Truth or Dare state validation', () => {
  it('accepts a valid choosing state from Supabase', () => {
    expect(normalizeOnlineTruthOrDare(validState).player_order).toEqual(['player-a', 'player-b']);
  });

  it('accepts a valid shared prompt', () => {
    const state = normalizeOnlineTruthOrDare({
      ...validState,
      current_prompt_id: 'f-t1',
      current_prompt_kind: 'truth',
      current_prompt_text: 'What made you laugh recently?',
    });
    expect(state.current_prompt_kind).toBe('truth');
    expect(state.current_prompt_text).toContain('laugh');
  });

  it('rejects a partially populated prompt', () => {
    expect(() => normalizeOnlineTruthOrDare({ ...validState, current_prompt_id: 'f-t1' })).toThrow(/Inconsistent active prompt/);
  });

  it('rejects an invalid turn index', () => {
    expect(() => normalizeOnlineTruthOrDare({ ...validState, current_turn_index: -1 })).toThrow(/Invalid current turn/);
  });

  it('rejects negative counters', () => {
    expect(() => normalizeOnlineTruthOrDare({ ...validState, skipped_count: -1 })).toThrow(/Invalid Truth or Dare counters/);
  });

  it('rejects a non-string player list', () => {
    expect(() => normalizeOnlineTruthOrDare({ ...validState, player_order: ['player-a', 7] })).toThrow(/invalid player order/);
  });
});
