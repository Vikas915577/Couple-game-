import { emptyBoard, findWinner, getResultStatus, type Board, type Mark } from './tic-tac-toe';

export type AiDifficulty = 'easy' | 'medium' | 'hard';

function available(board: Board): number[] {
  return board.map((cell, index) => cell === null ? index : -1).filter((index) => index >= 0);
}

function winScore(board: Board, ai: Mark): number {
  const winner = findWinner(board);
  if (winner === ai) return 10;
  if (winner && winner !== ai) return -10;
  return 0;
}

function minimax(board: Board, player: Mark, ai: Mark, depth: number): number {
  const result = getResultStatus(board);
  if (result === 'x_won' || result === 'o_won') return winScore(board, ai) - depth * Math.sign(winScore(board, ai));
  if (result === 'draw') return 0;

  const scores = available(board).map((index) => {
    const next = [...board] as Board;
    next[index] = player;
    return minimax(next, player === 'X' ? 'O' : 'X', ai, depth + 1);
  });
  return player === ai ? Math.max(...scores) : Math.min(...scores);
}

export function chooseComputerMove(board: Board, ai: Mark = 'O', difficulty: AiDifficulty = 'hard', random = Math.random()): number | null {
  const moves = available(board);
  if (moves.length === 0 || getResultStatus(board) !== 'playing') return null;
  const safeRandom = Math.min(Math.max(random, 0), 0.999999999999);
  const chooseRandom = (items: number[]) => items[Math.floor(safeRandom * items.length)];
  if (difficulty === 'easy') return chooseRandom(moves);

  const opponent: Mark = ai === 'X' ? 'O' : 'X';
  const immediateWin = moves.find((index) => {
    const next = [...board] as Board; next[index] = ai; return findWinner(next) === ai;
  });
  if (immediateWin !== undefined) return immediateWin;
  const immediateBlock = moves.find((index) => {
    const next = [...board] as Board; next[index] = opponent; return findWinner(next) === opponent;
  });
  if (immediateBlock !== undefined) return immediateBlock;

  if (difficulty === 'medium') {
    if (board[4] === null) return 4;
    const corners = moves.filter((index) => [0, 2, 6, 8].includes(index));
    if (corners.length) return chooseRandom(corners);
    return chooseRandom(moves);
  }

  let bestScore = Number.NEGATIVE_INFINITY;
  let bestMoves: number[] = [];
  for (const index of moves) {
    const next = [...board] as Board; next[index] = ai;
    const score = minimax(next, opponent, ai, 1);
    if (score > bestScore) { bestScore = score; bestMoves = [index]; }
    else if (score === bestScore) bestMoves.push(index);
  }
  return chooseRandom(bestMoves);
}

export function playAiMove(board: Board, ai: Mark = 'O', difficulty: AiDifficulty = 'hard'): Board {
  const index = chooseComputerMove(board, ai, difficulty);
  if (index === null) return board;
  const next = [...board] as Board;
  next[index] = ai;
  return next;
}

export function freshAiBoard(): Board { return emptyBoard(); }
