export type DareMode = 'friends' | 'couples';
export type PromptKind = 'truth' | 'dare';
export type PromptPack = 'classic' | 'funny' | 'romantic' | 'flirty' | 'spicy' | 'after-dark';
export const promptPackLabels: Record<PromptPack, string> = {
  classic: 'Classic', funny: 'Funny', romantic: 'Romantic', flirty: 'Flirty', spicy: 'Spicy 18+', 'after-dark': 'After Dark 18+',
};
export interface Prompt { id: string; mode: DareMode; kind: PromptKind; text: string; pack?: PromptPack; }

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
  { id: 'c-rom-t1', mode: 'couples', kind: 'truth', pack: 'romantic', text: 'What ordinary moment with your partner feels special to you?' },
  { id: 'c-rom-t2', mode: 'couples', kind: 'truth', pack: 'romantic', text: 'Which small thing your partner does makes you feel loved?' },
  { id: 'c-rom-d1', mode: 'couples', kind: 'dare', pack: 'romantic', text: 'Give your partner a 20-second appreciation speech with three specific details.' },
  { id: 'c-rom-d2', mode: 'couples', kind: 'dare', pack: 'romantic', text: 'Plan a mini date using only things already at home.' },
  { id: 'c-flirt-t1', mode: 'couples', kind: 'truth', pack: 'flirty', text: 'Which look or outfit of your partner do you find especially attractive?' },
  { id: 'c-flirt-t2', mode: 'couples', kind: 'truth', pack: 'flirty', text: 'What kind of affectionate gesture makes you feel most connected?' },
  { id: 'c-flirt-d1', mode: 'couples', kind: 'dare', pack: 'flirty', text: 'Hold eye contact for 15 seconds, then share one thing you appreciate.' },
  { id: 'c-flirt-d2', mode: 'couples', kind: 'dare', pack: 'flirty', text: 'Whisper a sincere compliment your partner has not heard from you before.' },
  { id: 'c-spicy-t1', mode: 'couples', kind: 'truth', pack: 'spicy', text: 'What new romantic experience would you like to try together, only if you both feel comfortable?' },
  { id: 'c-spicy-t2', mode: 'couples', kind: 'truth', pack: 'spicy', text: 'What makes you feel most desired and appreciated by your partner?' },
  { id: 'c-spicy-d1', mode: 'couples', kind: 'dare', pack: 'spicy', text: 'Offer a slow, affectionate hug and ask first; a wave or compliment is an equally valid alternative.' },
  { id: 'c-spicy-d2', mode: 'couples', kind: 'dare', pack: 'spicy', text: 'Choose a song that sets a romantic mood and explain why you picked it.' },
  { id: 'c-dark-t1', mode: 'couples', kind: 'truth', pack: 'after-dark', text: 'What boundary helps you feel safe while exploring more playful romance together?' },
  { id: 'c-dark-t2', mode: 'couples', kind: 'truth', pack: 'after-dark', text: 'What flirty fantasy date-night scenario would you enjoy discussing together? No details are required.' },
  { id: 'c-dark-t3', mode: 'couples', kind: 'truth', pack: 'after-dark', text: 'What type of affectionate attention do you wish you asked for more often?' },
  { id: 'c-dark-d1', mode: 'couples', kind: 'dare', pack: 'after-dark', text: 'Ask your partner to choose: a compliment, a hand-hold, a cuddle, or pass. Accept their answer without persuasion.' },
  { id: 'c-dark-d2', mode: 'couples', kind: 'dare', pack: 'after-dark', text: 'Plan a three-step date-night mood: one song, one snack, and one thing that helps you both relax.' },
  { id: 'c-dark-d3', mode: 'couples', kind: 'dare', pack: 'after-dark', text: 'Share one thing you find attractive about your partner. Keep it at the level you both enjoy.' },
  { id: 'f-funny-t1', mode: 'friends', kind: 'truth', pack: 'funny', text: 'What is the most ridiculous thing you believed as a kid?' },
  { id: 'f-funny-t2', mode: 'friends', kind: 'truth', pack: 'funny', text: 'What is your most harmless but oddly specific ick?' },
  { id: 'f-funny-d1', mode: 'friends', kind: 'dare', pack: 'funny', text: 'Give a dramatic acceptance speech for winning an imaginary award.' },
  { id: 'f-funny-d2', mode: 'friends', kind: 'dare', pack: 'funny', text: 'Let the group choose a silly nickname for you for the next two rounds.' },
  { id: 'f-spicy-t1', mode: 'friends', kind: 'truth', pack: 'spicy', text: 'What bold opinion do you only share when you really trust the group?' },
  { id: 'f-spicy-t2', mode: 'friends', kind: 'truth', pack: 'spicy', text: 'Have you ever had a crush you never told anyone about? You can skip names.' },
  { id: 'f-spicy-d1', mode: 'friends', kind: 'dare', pack: 'spicy', text: 'Deliver a cheesy movie-style pickup line with full confidence; anyone can pass.' },
  { id: 'f-spicy-d2', mode: 'friends', kind: 'dare', pack: 'spicy', text: 'Tell the group a funny embarrassing story you are comfortable sharing.' },
  { id: 'c-flirt-t3', mode: 'couples', kind: 'truth', pack: 'flirty', text: 'What look from your partner can distract you instantly?' },
  { id: 'c-flirt-t4', mode: 'couples', kind: 'truth', pack: 'flirty', text: 'What compliment would you love to hear more often?' },
  { id: 'c-flirt-d3', mode: 'couples', kind: 'dare', pack: 'flirty', text: 'Give your partner a playful movie-style pickup line; let them rate the delivery.' },
  { id: 'c-flirt-d4', mode: 'couples', kind: 'dare', pack: 'flirty', text: 'Choose one: a cheeky compliment, a 10-second dance, or a pass.' },
  { id: 'c-spicy-t3', mode: 'couples', kind: 'truth', pack: 'spicy', text: 'What kind of flirting makes you feel most wanted without feeling pressured?' },
  { id: 'c-spicy-t4', mode: 'couples', kind: 'truth', pack: 'spicy', text: 'What is one romantic thing you would like your partner to initiate more often?' },
  { id: 'c-spicy-d3', mode: 'couples', kind: 'dare', pack: 'spicy', text: 'Give your partner a slow, fully-clothed 15-second dance, or choose a compliment instead.' },
  { id: 'c-spicy-d4', mode: 'couples', kind: 'dare', pack: 'spicy', text: 'Tell your partner one thing you find irresistibly attractive, keeping details at your shared comfort level.' },
  { id: 'c-dark-t4', mode: 'couples', kind: 'truth', pack: 'after-dark', text: 'What kind of teasing feels fun to you, and what crosses a boundary?' },
  { id: 'c-dark-t5', mode: 'couples', kind: 'truth', pack: 'after-dark', text: 'Which romantic moment would you love to replay with your partner?' },
  { id: 'c-dark-t6', mode: 'couples', kind: 'truth', pack: 'after-dark', text: 'What makes a private, romantic moment feel exciting and safe at the same time?' },
  { id: 'c-dark-d4', mode: 'couples', kind: 'dare', pack: 'after-dark', text: 'Let your partner choose a 20-second slow dance, a forehead kiss, a hug, or pass; accept their choice without pressure.' },
  { id: 'c-dark-d5', mode: 'couples', kind: 'dare', pack: 'after-dark', text: 'Whisper a bold but respectful compliment and let your partner decide whether to return one.' },
  { id: 'c-dark-d6', mode: 'couples', kind: 'dare', pack: 'after-dark', text: 'Take turns naming one thing you would like more of in date night: affection, attention, laughter, or conversation.' },
  { id: 'f-spicy-t3', mode: 'friends', kind: 'truth', pack: 'spicy', text: 'What is the boldest harmless thing you have done to impress a crush?' },
  { id: 'f-spicy-t4', mode: 'friends', kind: 'truth', pack: 'spicy', text: 'What flirting style do you think you have: smooth, shy, funny, or chaotic?' },
  { id: 'f-spicy-d3', mode: 'friends', kind: 'dare', pack: 'spicy', text: 'Read a fictional pickup line in the most dramatic voice you can; anyone can pass.' },
  { id: 'f-spicy-d4', mode: 'friends', kind: 'dare', pack: 'spicy', text: 'Give yourself a playful dating-show introduction in ten seconds.' },
];

export function getPromptDeck(mode: DareMode, kind?: PromptKind, pack: PromptPack = 'classic'): Prompt[] {
  return truthOrDarePrompts.filter((prompt) => prompt.mode === mode && (!kind || prompt.kind === kind) && (pack === 'classic' ? (!prompt.pack || prompt.pack === 'classic') : prompt.pack === pack));
}

export function drawPrompt(mode: DareMode, kind: PromptKind, usedIds: string[], random = Math.random(), pack: PromptPack = 'classic'): Prompt | null {
  const deck = getPromptDeck(mode, kind, pack);
  const fresh = deck.filter((prompt) => !usedIds.includes(prompt.id));
  const candidates = fresh.length ? fresh : deck;
  if (!candidates.length) return null;
  const safeRandom = Math.min(Math.max(random, 0), 0.999999999999);
  return candidates[Math.floor(safeRandom * candidates.length)];
}
