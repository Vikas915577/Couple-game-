export type AdultHubGameStatus = 'playable' | 'coming-soon';
export type AdultHubMode = 'friends' | 'couples';

export interface AdultHubGame {
  id: string;
  title: string;
  description: string;
  emoji: string;
  status: AdultHubGameStatus;
  players: string;
  duration: string;
  linkedGameId?: 'truth-dare-friends' | 'couple-truth-dare';
  mode?: AdultHubMode;
}

/**
 * Adult-zone cards are deliberately separate from the regular catalogue.
 * Only cards backed by an existing playable game may start a room; previews
 * stay clearly marked coming-soon until their game logic and tests exist.
 */
export const adultHubGames: AdultHubGame[] = [
  {
    id: 'adult-truth-dare',
    title: 'Adult Truth or Dare',
    description: 'Bolder party questions, cheeky challenges, and a no-pressure skip option.',
    emoji: '🔥',
    status: 'playable',
    players: '2–10 players',
    duration: '10–20 min',
    linkedGameId: 'truth-dare-friends',
    mode: 'friends',
  },
  {
    id: 'couples-after-dark',
    title: 'Couples After Dark',
    description: 'Flirty questions and romantic dares for consenting adult partners.',
    emoji: '🌙',
    status: 'playable',
    players: '2 players',
    duration: '10–20 min',
    linkedGameId: 'couple-truth-dare',
    mode: 'couples',
  },
  {
    id: 'spin-the-bottle-18',
    title: 'Spin the Bottle 18+',
    description: 'A future party mode with opt-in, customisable prompt types.',
    emoji: '🍷',
    status: 'coming-soon',
    players: '3–10 players',
    duration: '10–25 min',
  },
  {
    id: 'dirty-would-you-rather',
    title: 'After-Dark Would You Rather',
    description: 'Two bold choices per round, private voting, then a group reveal.',
    emoji: '🖤',
    status: 'coming-soon',
    players: '2–10 players',
    duration: '5–15 min',
  },
  {
    id: 'couples-challenge-roulette',
    title: 'Couples Challenge Roulette',
    description: 'Pick a comfort level and draw a surprise date-night challenge.',
    emoji: '🎡',
    status: 'coming-soon',
    players: '2 players',
    duration: '10–20 min',
  },
  {
    id: 'adult-quiz-battle',
    title: 'Adult Quiz Battle',
    description: 'Playful grown-up trivia and couple-compatibility rounds.',
    emoji: '🥂',
    status: 'coming-soon',
    players: '2–8 players',
    duration: '5–15 min',
  },
  {
    id: 'mystery-dare-wheel',
    title: 'Mystery Dare Wheel',
    description: 'A spin-to-pick challenge wheel with categories chosen by the room.',
    emoji: '🎯',
    status: 'coming-soon',
    players: '2–10 players',
    duration: '5–15 min',
  },
];

export function getAdultHubGames(status?: AdultHubGameStatus): AdultHubGame[] {
  return adultHubGames.filter((game) => !status || game.status === status);
}
