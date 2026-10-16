import { describe, expect, it } from 'vitest';
import { chooseComputerMove } from './tic-tac-toe-ai';
import { emptyBoard, getResultStatus, type Board } from './tic-tac-toe';

describe('Tic Tac Toe computer opponent', () => {
  it('chooses an available move on an empty board', () => {
    const index = chooseComputerMove(emptyBoard(), 'O', 'hard', 0.5);
    expect(index).not.toBeNull();
    expect(emptyBoard()[index!]).toBeNull();
  });

  it('takes an immediate win before other moves', () => {
    const board: Board = ['O', 'O', null, 'X', 'X', null, null, null, null];
    expect(chooseComputerMove(board, 'O', 'hard')).toBe(2);
  });

  it('blocks an immediate human win', () => {
    const board: Board = ['X', 'X', null, 'O', null, null, null, null, null];
    expect(chooseComputerMove(board, 'O', 'hard')).toBe(2);
  });

  it('hard difficulty never chooses an occupied square', () => {
    const board: Board = ['X', null, null, null, 'O', null, null, null, null];
    const index = chooseComputerMove(board, 'O', 'hard');
    expect(index).not.toBeNull();
    expect(board[index!]).toBeNull();
  });

  it('returns null after a game has ended', () => {
    const board: Board = ['X', 'X', 'X', 'O', 'O', null, null, null, null];
    expect(getResultStatus(board)).toBe('x_won');
    expect(chooseComputerMove(board, 'O', 'hard')).toBeNull();
  });
});
