import { describe, expect, it } from 'vitest';
import { normalizeOnlineLudo } from './ludo-online';

const validState = {
  players: [
    { id: 'user-a', name: 'A', color: 'red', isComputer: false, tokens: [-1, -1, -1, -1] },
    { id: 'user-b', name: 'B', color: 'blue', isComputer: false, tokens: [-1, -1, -1, -1] },
  ],
  currentPlayerIndex: 0,
  die: null,
  rolled: false,
  legalTokenIndices: [],
  winnerId: null,
  message: 'Ready',
  turnNumber: 1,
};

describe('online Ludo state validation', () => {
  it('accepts a valid two-player state', () => {
    expect(normalizeOnlineLudo(validState).players).toHaveLength(2);
  });
  it('accepts legal dice and token choices', () => {
    expect(normalizeOnlineLudo({ ...validState, die: 6, rolled: true, legalTokenIndices: [0, 1] }).legalTokenIndices).toEqual([0, 1]);
  });
  it('rejects impossible token progress', () => {
    const malformed = { ...validState, players: [{ ...validState.players[0], tokens: [-2, -1, -1, -1] }, validState.players[1]] };
    expect(() => normalizeOnlineLudo(malformed)).toThrow(/token position/);
  });
  it('rejects a missing board', () => {
    expect(() => normalizeOnlineLudo(null)).toThrow(/missing/);
  });
});
