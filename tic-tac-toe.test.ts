import { describe, expect, it } from 'vitest';
import {
  applyMove,
  emptyBoard,
  findWinner,
  findWinningLine,
  getResultStatus,
  isDraw,
  markForUser,
  normalizeBoard,
} from './tic-tac-toe';

describe('Tic Tac Toe rules', () => {
  it('starts with nine empty cells', () => {
    expect(emptyBoard()).toEqual([null, null, null, null, null, null, null, null, null]);
  });

  it('applies a valid move without mutating the original board', () => {
    const board = emptyBoard();
    const next = applyMove(board, 4, 'X');
    expect(board[4]).toBeNull();
    expect(next[4]).toBe('X');
  });

  it('rejects an invalid cell index', () => {
    expect(() => applyMove(emptyBoard(), -1, 'X')).toThrow('valid cell');
    expect(() => applyMove(emptyBoard(), 9, 'X')).toThrow('valid cell');
  });

  it('rejects moves to an occupied cell', () => {
    const board = applyMove(emptyBoard(), 0, 'X');
    expect(() => applyMove(board, 0, 'O')).toThrow('already occupied');
  });

  it('finds row, column and diagonal wins', () => {
    expect(findWinner(['X', 'X', 'X', 'O', null, 'O', null, null, null])).toBe('X');
    expect(findWinner(['O', 'X', null, 'O', 'X', null, 'O', null, 'X'])).toBe('O');
    expect(findWinner(['X', 'O', 'O', null, 'X', null, 'O', null, 'X'])).toBe('X');
  });

  it('returns the winning cells for highlighting', () => {
    expect(findWinningLine(['O', null, null, 'O', 'X', null, 'O', 'X', 'X'])).toEqual([0, 3, 6]);
  });

  it('detects a draw and does not call it a winner', () => {
    const board = ['X', 'O', 'X', 'X', 'O', 'O', 'O', 'X', 'X'] as const;
    expect(findWinner(board)).toBeNull();
    expect(isDraw(board)).toBe(true);
    expect(getResultStatus(board)).toBe('draw');
  });

  it('does not allow moves after the round ends', () => {
    const winningBoard = ['X', 'X', 'X', 'O', 'O', null, null, null, null] as const;
    expect(() => applyMove(winningBoard, 5, 'O')).toThrow('already ended');
  });

  it('maps remote player IDs to their marks', () => {
    const state = { x_user_id: 'user-1', o_user_id: 'user-2' };
    expect(markForUser(state, 'user-1')).toBe('X');
    expect(markForUser(state, 'user-2')).toBe('O');
    expect(markForUser(state, 'user-3')).toBeNull();
    expect(markForUser(state, null)).toBeNull();
  });

  it('normalizes malformed backend boards safely', () => {
    expect(normalizeBoard(['X', 'O', 'bad'])).toHaveLength(9);
    expect(normalizeBoard('invalid')).toEqual(emptyBoard());
    expect(normalizeBoard(['X', 'O', 'bad'])).toEqual(['X', 'O', null, null, null, null, null, null, null]);
  });
});
