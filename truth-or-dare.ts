export type DareMode = 'friends' | 'couples';
export type PromptKind = 'truth' | 'dare';
export interface Prompt { id: string; mode: DareMode; kind: PromptKind; text: string; }

export const truthOrDarePrompts: Prompt[] = [
  { id: 'f-t1', mode: 'friends', kind: 'truth', text: 'What is the funniest misunderstanding you have ever had?' },
  { id: 'f-t2', mode: 'friends', kind: 'truth', text: 'Which song do you secretly know every word to?' },
  { id: 'f-t3', mode: 'friends', kind: 'truth', text: 'What is one harmless habit your friends always tease you about?' },
  { id: 'f-t4', mode: 'friends', kind: 'truth', text: 'What was your most awkward first impression of someone here?' },
  { id: 'f-t5', mode: 'friends', kind: 'truth', text: 'What small thing instantly improves your mood?' },
  { id: 'f-d1', mode: 'friends', kind: 'dare', text: 'Give a dramatic 10-second movie-trailer voice-over for the person on your left.' },
  { id: 'f-d2', mode: 'friends', kind: 'dare', text: 'Do your best robot dance for 15 seconds.' },
  { id: 'f-d3', mode: 'friends', kind: 'dare', text: 'Describe your day using only three emojis, then explain them.' },
  { id: 'f-d4', mode: 'friends', kind: 'dare', text: 'Speak like a news reporter until your next turn.' },
  { id: 'f-d5', mode: 'friends', kind: 'dare', text: 'Make up a two-line friendship anthem on the spot.' },
  { id: 'c-t1', mode: 'couples', kind: 'truth', text: 'What was the first little thing you noticed about your partner?' },
  { id: 'c-t2', mode: 'couples', kind: 'truth', text: 'What is one memory together that always makes you smile?' },
  { id: 'c-t3', mode: 'couples', kind: 'truth', text: 'What simple date would make you happiest right now?' },
  { id: 'c-t4', mode: 'couples', kind: 'truth', text: 'What is one thing your partner does that makes you feel appreciated?' },
  { id: 'c-t5', mode: 'couples', kind: 'truth', text: 'Which song would you pick as the soundtrack to a favourite memory together?' },
  { id: 'c-d1', mode: 'couples', kind: 'dare', text: 'Give your partner a sincere compliment you have not said today.' },
  { id: 'c-d2', mode: 'couples', kind: 'dare', text: 'Plan a dream date in 30 seconds using only three details.' },
  { id: 'c-d3', mode: 'couples', kind: 'dare', text: 'Draw a tiny portrait of your partner in 20 seconds.' },
  { id: 'c-d4', mode: 'couples', kind: 'dare', text: 'Recreate how you think your partner looks when excited.' },
  { id: 'c-d5', mode: 'couples', kind: 'dare', text: 'Say one thing you appreciate about the way your partner thinks.' },
];

export function getPromptDeck(mode: DareMode, kind?: PromptKind): Prompt[] {
  return truthOrDarePrompts.filter((prompt) => prompt.mode === mode && (!kind || prompt.kind === kind));
}

export function drawPrompt(mode: DareMode, kind: PromptKind, usedIds: string[], random = Math.random()): Prompt | null {
  const deck = getPromptDeck(mode, kind);
  const fresh = deck.filter((prompt) => !usedIds.includes(prompt.id));
  const candidates = fresh.length ? fresh : deck;
  if (!candidates.length) return null;
  const safeRandom = Math.min(Math.max(random, 0), 0.999999999999);
  return candidates[Math.floor(safeRandom * candidates.length)];
}
