export type LudoColor = 'red' | 'blue' | 'green' | 'yellow';
export type LudoTokenProgress = number; // -1 yard, 0–51 shared track, 52–57 home lane, 58 finished
export interface LudoPlayer { id: string; name: string; color: LudoColor; isComputer: boolean; tokens: LudoTokenProgress[]; }
export interface LudoState {
  players: LudoPlayer[];
  currentPlayerIndex: number;
  die: number | null;
  rolled: boolean;
  legalTokenIndices: number[];
  winnerId: string | null;
  message: string;
  turnNumber: number;
}

export const LUDO_COLORS: LudoColor[] = ['red', 'blue', 'green', 'yellow'];
export const LUDO_START_OFFSETS: Record<LudoColor, number> = { red: 0, blue: 13, green: 26, yellow: 39 };
export const LUDO_SAFE_SQUARES = new Set([0, 8, 13, 21, 26, 34, 39, 47]);

export function createLudoGame(names: string[], computerFlags: boolean[] = []): LudoState {
  const count = Math.min(4, Math.max(2, names.length));
  const safeNames = names.slice(0, count);
  while (safeNames.length < count) safeNames.push(`Player ${safeNames.length + 1}`);
  return {
    players: safeNames.map((name, i) => ({
      id: `p${i + 1}`, name: name.trim().slice(0, 18) || `Player ${i + 1}`,
      color: LUDO_COLORS[i], isComputer: Boolean(computerFlags[i]), tokens: [-1, -1, -1, -1],
    })),
    currentPlayerIndex: 0, die: null, rolled: false, legalTokenIndices: [], winnerId: null,
    message: `${safeNames[0]} starts. Roll the die.`, turnNumber: 1,
  };
}

export function globalTrackPosition(color: LudoColor, progress: number): number | null {
  if (progress < 0 || progress > 51) return null;
  return (LUDO_START_OFFSETS[color] + progress) % 52;
}

export function legalLudoTokens(state: LudoState, die: number): number[] {
  const player = state.players[state.currentPlayerIndex];
  if (!player || !Number.isInteger(die) || die < 1 || die > 6 || state.winnerId) return [];
  return player.tokens.map((progress, index) => {
    if (progress === 58) return -1;
    if (progress === -1) return die === 6 ? index : -1;
    return progress + die <= 58 ? index : -1;
  }).filter((index) => index >= 0);
}

export function rollLudoDie(state: LudoState, value = Math.floor(Math.random() * 6) + 1): LudoState {
  if (state.winnerId) return state;
  if (state.rolled) throw new Error('Move a token before rolling again.');
  if (!Number.isInteger(value) || value < 1 || value > 6) throw new Error('Die value must be from 1 to 6.');
  const legal = legalLudoTokens(state, value);
  const player = state.players[state.currentPlayerIndex];
  if (legal.length === 0) {
    const keepTurn = value === 6;
    const nextIndex = keepTurn ? state.currentPlayerIndex : (state.currentPlayerIndex + 1) % state.players.length;
    return { ...state, currentPlayerIndex: nextIndex, die: value, rolled: false, legalTokenIndices: [], turnNumber: keepTurn ? state.turnNumber : state.turnNumber + 1,
      message: `${player.name} rolled ${value} but has no legal move.${keepTurn ? ' Roll again.' : ` ${state.players[nextIndex].name}'s turn.`}` };
  }
  return { ...state, die: value, rolled: true, legalTokenIndices: legal, message: `${player.name} rolled ${value}. Choose a token.` };
}

export function moveLudoToken(state: LudoState, tokenIndex: number): LudoState {
  if (!state.rolled || state.die === null) throw new Error('Roll the die first.');
  if (!state.legalTokenIndices.includes(tokenIndex)) throw new Error('That token cannot move with this roll.');
  const player = state.players[state.currentPlayerIndex];
  const previous = player.tokens[tokenIndex];
  const nextProgress = previous === -1 ? 0 : previous + state.die;
  const nextTokens = [...player.tokens];
  nextTokens[tokenIndex] = nextProgress;
  const players = state.players.map((p, i) => i === state.currentPlayerIndex ? { ...p, tokens: nextTokens } : { ...p, tokens: [...p.tokens] });
  let captured = false;
  const landing = globalTrackPosition(player.color, nextProgress);
  if (landing !== null && !LUDO_SAFE_SQUARES.has(landing)) {
    for (let i = 0; i < players.length; i++) {
      if (i === state.currentPlayerIndex) continue;
      const opponent = players[i];
      const resetTokens = [...opponent.tokens];
      for (let token = 0; token < resetTokens.length; token++) {
        if (resetTokens[token] >= 0 && resetTokens[token] <= 51 && globalTrackPosition(opponent.color, resetTokens[token]) === landing) {
          resetTokens[token] = -1; captured = true;
        }
      }
      players[i] = { ...opponent, tokens: resetTokens };
    }
  }
  const winner = nextTokens.every((progress) => progress === 58) ? player.id : null;
  const bonus = state.die === 6 || captured;
  const nextIndex = winner || bonus ? state.currentPlayerIndex : (state.currentPlayerIndex + 1) % players.length;
  const nextPlayer = players[nextIndex];
  return {
    ...state, players, currentPlayerIndex: nextIndex, die: null, rolled: false, legalTokenIndices: [], winnerId: winner,
    turnNumber: nextIndex === state.currentPlayerIndex ? state.turnNumber : state.turnNumber + 1,
    message: winner ? `${player.name} gets all four tokens home and wins!` : `${player.name} moved token ${tokenIndex + 1}${captured ? ' and captured an opponent!' : ''}.${bonus ? ' Bonus turn!' : ` ${nextPlayer.name}'s turn.`}`,
  };
}

export function chooseLudoBotToken(state: LudoState): number | null {
  if (!state.rolled || state.die === null) return null;
  const player = state.players[state.currentPlayerIndex];
  let bestIndex: number | null = null;
  let bestScore = Number.NEGATIVE_INFINITY;
  for (const index of state.legalTokenIndices) {
    const oldProgress = player.tokens[index];
    const nextProgress = oldProgress === -1 ? 0 : oldProgress + state.die;
    let score = nextProgress === 58 ? 1000 : nextProgress >= 52 ? 50 + nextProgress : nextProgress;
    const landing = globalTrackPosition(player.color, nextProgress);
    if (landing !== null && !LUDO_SAFE_SQUARES.has(landing) && state.players.some((p, i) => i !== state.currentPlayerIndex && p.tokens.some((progress) => globalTrackPosition(p.color, progress) === landing))) score += 300;
    if (nextProgress === 0) score += 100;
    if (landing !== null && LUDO_SAFE_SQUARES.has(landing)) score += 30;
    if (score > bestScore) { bestScore = score; bestIndex = index; }
  }
  return bestIndex;
}
