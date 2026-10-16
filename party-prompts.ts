export type PartyGameId = 'would-you-rather' | 'this-or-that' | 'never-have-i-ever' | 'most-likely-to' | 'guess-word' | 'partner-quiz' | 'our-story';

export interface PartyPrompt { id: string; gameId: PartyGameId; text: string; left?: string; right?: string; category: 'funny' | 'friends' | 'couples'; }

export const partyPrompts: PartyPrompt[] = [
  { id: 'wyr-01', gameId: 'would-you-rather', text: 'Would you rather…', left: 'Have a perfect memory', right: 'Read minds for 10 seconds', category: 'funny' },
  { id: 'wyr-02', gameId: 'would-you-rather', text: 'Would you rather…', left: 'Travel free for life', right: 'Eat free at your favourite restaurant', category: 'funny' },
  { id: 'wyr-03', gameId: 'would-you-rather', text: 'Would you rather…', left: 'Always be 10 minutes early', right: 'Always be 10 minutes late', category: 'friends' },
  { id: 'wyr-04', gameId: 'would-you-rather', text: 'Would you rather…', left: 'Plan every date together', right: 'Be surprised every time', category: 'couples' },
  { id: 'wyr-05', gameId: 'would-you-rather', text: 'Would you rather…', left: 'A cosy night in', right: 'A spontaneous night out', category: 'couples' },
  { id: 'tot-01', gameId: 'this-or-that', text: 'Pick your vibe', left: 'Beach sunset', right: 'Mountain sunrise', category: 'friends' },
  { id: 'tot-02', gameId: 'this-or-that', text: 'Pick your vibe', left: 'Long voice call', right: 'All-day texting', category: 'couples' },
  { id: 'tot-03', gameId: 'this-or-that', text: 'Pick your vibe', left: 'Funny compliments', right: 'Deep conversations', category: 'couples' },
  { id: 'nhi-01', gameId: 'never-have-i-ever', text: 'Never have I ever sent a message to the wrong chat.', category: 'funny' },
  { id: 'nhi-02', gameId: 'never-have-i-ever', text: 'Never have I ever laughed at the worst possible moment.', category: 'funny' },
  { id: 'nhi-03', gameId: 'never-have-i-ever', text: 'Never have I ever planned a surprise for someone here.', category: 'friends' },
  { id: 'nhi-04', gameId: 'never-have-i-ever', text: 'Never have I ever forgotten an important date and tried to recover smoothly.', category: 'couples' },
  { id: 'mlt-01', gameId: 'most-likely-to', text: 'Who is most likely to become famous by accident?', category: 'friends' },
  { id: 'mlt-02', gameId: 'most-likely-to', text: 'Who is most likely to make everyone laugh during a serious moment?', category: 'funny' },
  { id: 'mlt-03', gameId: 'most-likely-to', text: 'Who is most likely to remember a tiny detail from your first date?', category: 'couples' },
  { id: 'word-01', gameId: 'guess-word', text: 'Movie', category: 'funny' },
  { id: 'word-02', gameId: 'guess-word', text: 'Airport', category: 'friends' },
  { id: 'word-03', gameId: 'guess-word', text: 'First date', category: 'couples' },
  { id: 'pq-01', gameId: 'partner-quiz', text: 'What is my ideal way to unwind after a long day?', category: 'couples' },
  { id: 'pq-02', gameId: 'partner-quiz', text: 'Which small gesture makes me feel appreciated?', category: 'couples' },
  { id: 'story-01', gameId: 'our-story', text: 'Which shared memory would you happily relive?', category: 'couples' },
  { id: 'story-02', gameId: 'our-story', text: 'What was your favourite tiny moment from our first few dates?', category: 'couples' },
];

export function getPartyPrompts(gameId: string, usedIds: string[] = []): PartyPrompt[] {
  const prompts = partyPrompts.filter((p) => p.gameId === gameId);
  const fresh = prompts.filter((p) => !usedIds.includes(p.id));
  return fresh.length ? fresh : prompts;
}
