export type GameCategory = 'all' | 'board' | 'friends' | 'couples';
export type GameStatus = 'mvp' | 'planned';

export interface GameDefinition {
  id: string;
  name: string;
  category: Exclude<GameCategory, 'all'>;
  shortDescription: string;
  players: string;
  duration: string;
  emoji: string;
  theme: string;
  status: GameStatus;
  tags: string[];
}

export const games: GameDefinition[] = [
  {
    id: 'truth-dare-friends',
    name: 'Truth or Dare',
    category: 'friends',
    shortDescription: 'Funny questions, bold choices, big laughs.',
    players: '2–10 players',
    duration: '10–20 min',
    emoji: '🎭',
    theme: 'peach',
    status: 'mvp',
    tags: ['party', 'questions', 'classic'],
  },
  {
    id: 'couple-truth-dare',
    name: 'Couple Truth or Dare',
    category: 'couples',
    shortDescription: 'Cute, romantic and deeper conversation prompts.',
    players: '2 players',
    duration: '10–20 min',
    emoji: '💗',
    theme: 'rose',
    status: 'mvp',
    tags: ['couple', 'date night', 'questions'],
  },
  {
    id: 'tic-tac-toe',
    name: 'Tic Tac Toe',
    category: 'board',
    shortDescription: 'Quick head-to-head matches. Best of three?',
    players: '2 players',
    duration: '2–5 min',
    emoji: '❎',
    theme: 'blue',
    status: 'mvp',
    tags: ['board', 'quick', 'strategy'],
  },
  {
    id: 'would-you-rather',
    name: 'Would You Rather',
    category: 'friends',
    shortDescription: 'Pick a side and see what your group thinks.',
    players: '2–10 players',
    duration: '5–15 min',
    emoji: '🤔',
    theme: 'lavender',
    status: 'mvp',
    tags: ['party', 'votes', 'questions'],
  },
  {
    id: 'partner-quiz',
    name: 'How Well Do You Know Me?',
    category: 'couples',
    shortDescription: 'Reveal how well you really know each other.',
    players: '2 players',
    duration: '5–15 min',
    emoji: '🫶',
    theme: 'mint',
    status: 'mvp',
    tags: ['couple', 'quiz', 'date night'],
  },
  {
    id: 'chess',
    name: 'Chess',
    category: 'board',
    shortDescription: 'A classic battle of patience and planning.',
    players: '2 players',
    duration: '5–30 min',
    emoji: '♟️',
    theme: 'sand',
    status: 'planned',
    tags: ['board', 'strategy', 'classic'],
  },
  {
    id: 'ludo',
    name: 'Ludo',
    category: 'board',
    shortDescription: 'Roll the dice, race home, and tease your friends.',
    players: '2–4 players',
    duration: '10–30 min',
    emoji: '🎲',
    theme: 'lime',
    status: 'planned',
    tags: ['board', 'dice', 'classic'],
  },
  {
    id: 'this-or-that',
    name: 'Couples This or That',
    category: 'couples',
    shortDescription: 'Discover your little differences and shared favourites.',
    players: '2 players',
    duration: '5–10 min',
    emoji: '💞',
    theme: 'rose',
    status: 'planned',
    tags: ['couple', 'choices', 'date night'],
  },
  {
    id: 'never-have-i-ever',
    name: 'Never Have I Ever',
    category: 'friends',
    shortDescription: 'A light-hearted way to learn surprising stories.',
    players: '2–10 players',
    duration: '10–20 min',
    emoji: '🙋',
    theme: 'lavender',
    status: 'planned',
    tags: ['party', 'stories', 'questions'],
  },
  {
    id: 'most-likely-to',
    name: 'Most Likely To',
    category: 'friends',
    shortDescription: 'Vote on the friend most likely to do the thing.',
    players: '3–10 players',
    duration: '5–15 min',
    emoji: '👉',
    theme: 'blue',
    status: 'planned',
    tags: ['party', 'votes', 'group'],
  },
  {
    id: 'our-story',
    name: 'Our Story Quiz',
    category: 'couples',
    shortDescription: 'Little memories, firsts and favourite moments.',
    players: '2 players',
    duration: '5–15 min',
    emoji: '📖',
    theme: 'peach',
    status: 'planned',
    tags: ['couple', 'memories', 'quiz'],
  },
  {
    id: 'guess-word',
    name: 'Guess the Word',
    category: 'friends',
    shortDescription: 'Describe it, guess it before the timer runs out.',
    players: '3–10 players',
    duration: '5–15 min',
    emoji: '💬',
    theme: 'mint',
    status: 'planned',
    tags: ['party', 'team', 'word'],
  },
];

export const categoryLabels: Record<GameCategory, string> = {
  all: 'All games',
  board: 'Board games',
  friends: 'Friends & party',
  couples: 'Couples corner',
};

export function filterGames(
  catalog: GameDefinition[],
  category: GameCategory,
  query: string,
): GameDefinition[] {
  const normalizedQuery = query.trim().toLowerCase();
  return catalog.filter((game) => {
    const matchesCategory = category === 'all' || game.category === category;
    const searchable = [game.name, game.shortDescription, ...game.tags].join(' ').toLowerCase();
    return matchesCategory && (!normalizedQuery || searchable.includes(normalizedQuery));
  });
}

export function isValidRoomCode(value: string): boolean {
  return /^[A-Z0-9]{6,8}$/.test(value.trim().toUpperCase());
}

export function makeDemoRoomCode(randomValue = Math.random()): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const normalized = Math.min(Math.max(randomValue, 0), 0.999999999999);
  const start = Math.floor(normalized * alphabet.length);
  return Array.from({ length: 6 }, (_, index) => alphabet[(start + index * 7) % alphabet.length]).join('');
}
