import { describe, expect, it } from 'vitest';
import { drawPrompt, getPromptDeck } from './truth-or-dare';

describe('Truth or Dare prompt deck', () => {
  it('has separate prompts for friends and couples', () => {
    expect(getPromptDeck('friends').length).toBeGreaterThanOrEqual(8);
    expect(getPromptDeck('couples').length).toBeGreaterThanOrEqual(8);
    expect(getPromptDeck('friends').every((prompt) => prompt.mode === 'friends')).toBe(true);
    expect(getPromptDeck('couples').every((prompt) => prompt.mode === 'couples')).toBe(true);
  });
  it('contains both truth and dare in each mode', () => {
    for (const mode of ['friends', 'couples'] as const) {
      expect(getPromptDeck(mode, 'truth').length).toBeGreaterThan(0);
      expect(getPromptDeck(mode, 'dare').length).toBeGreaterThan(0);
    }
  });
  it('does not repeat a used prompt until the deck is exhausted', () => {
    const deck = getPromptDeck('friends', 'truth');
    const prompt = drawPrompt('friends', 'truth', deck.slice(0, -1).map((item) => item.id), 0);
    expect(prompt?.id).toBe(deck[deck.length - 1].id);
  });
  it('starts a new cycle after all matching prompts were used', () => {
    const deck = getPromptDeck('couples', 'dare');
    expect(drawPrompt('couples', 'dare', deck.map((item) => item.id), 0)?.mode).toBe('couples');
  });
  it('starts another prompt cycle when all prompts of a type were used', () => {
    const used = getPromptDeck('friends', 'truth').map((prompt) => prompt.id);
    expect(drawPrompt('friends', 'truth', used, 0)?.kind).toBe('truth');
  });

  it('keeps adult-oriented couples packs separate from the classic deck', () => {
    expect(getPromptDeck('couples', 'truth', 'after-dark').every((prompt) => prompt.pack === 'after-dark')).toBe(true);
    expect(getPromptDeck('couples', 'dare', 'spicy').length).toBeGreaterThan(0);
    expect(getPromptDeck('friends', 'truth', 'after-dark')).toHaveLength(0);
  });
});
