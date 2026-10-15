export type Mark = 'X' | 'O';
export type Cell = Mark | null;
export type Board = Cell[];
export type TicTacToeStatus = 'waiting' | 'playing' | 'x_won' | 'o_won' | 'draw';

export interface TicTacToeState {
  room_id: string;
  board: Board;
  status: TicTacToeStatus;
  x_user_id: string | null;
  o_user_id: string | null;
  current_turn_user_id: string | null;
  winner_user_id: string | null;
  x_rematch_ready: boolean;
  o_rematch_ready: boolean;
  updated_at: string;
}

export const WINNING_LINES: ReadonlyArray<readonly [number, number, number]> = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

export function emptyBoard(): Board {
  return Array<Cell>(9).fill(null);
}

export function findWinner(board: readonly Cell[]): Mark | null {
  for (const [a, b, c] of WINNING_LINES) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a];
  }
  return null;
}

export function findWinningLine(board: readonly Cell[]): readonly number[] | null {
  for (const line of WINNING_LINES) {
    const [a, b, c] = line;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) return line;
  }
  return null;
}

export function isDraw(board: readonly Cell[]): boolean {
  return !findWinner(board) && board.length === 9 && board.every((cell) => cell !== null);
}

export function applyMove(board: readonly Cell[], index: number, mark: Mark): Board {
  if (board.length !== 9) throw new Error('A Tic Tac Toe board must contain exactly 9 cells.');
  if (!Number.isInteger(index) || index < 0 || index > 8) throw new Error('Choose a valid cell.');
  if (findWinner(board) || isDraw(board)) throw new Error('This round has already ended.');
  if (board[index] !== null) throw new Error('That cell is already occupied.');
  const next = [...board];
  next[index] = mark;
  return next;
}

export function getResultStatus(board: readonly Cell[]): TicTacToeStatus {
  const winner = findWinner(board);
  if (winner === 'X') return 'x_won';
  if (winner === 'O') return 'o_won';
  if (isDraw(board)) return 'draw';
  return 'playing';
}

export function markForUser(state: Pick<TicTacToeState, 'x_user_id' | 'o_user_id'>, userId: string | null): Mark | null {
  if (!userId) return null;
  if (state.x_user_id === userId) return 'X';
  if (state.o_user_id === userId) return 'O';
  return null;
}

export function normalizeBoard(value: unknown): Board {
  if (!Array.isArray(value)) return emptyBoard();
  // Be defensive with stale/malformed backend data: preserve valid cells, discard
  // unknown values, and always return exactly nine cells to keep the board render safe.
  return Array.from({ length: 9 }, (_, index): Cell => {
    const cell = value[index];
    return cell === 'X' || cell === 'O' ? cell : null;
  });
}
