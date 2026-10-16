import { describe, expect, it } from 'vitest';
import { getPartyPrompts, partyPrompts } from './party-prompts';

describe('party prompt packs', () => {
  it('has prompts for the supported local party games', () => {
    for (const gameId of ['would-you-rather', 'this-or-that', 'never-have-i-ever', 'most-likely-to', 'guess-word', 'partner-quiz', 'our-story']) {
      expect(getPartyPrompts(gameId).length).toBeGreaterThan(0);
    }
  });
  it('has unique prompt IDs', () => {
    expect(new Set(partyPrompts.map((prompt) => prompt.id)).size).toBe(partyPrompts.length);
  });
  it('cycles prompts only after the pack is exhausted', () => {
    const deck = getPartyPrompts('would-you-rather');
    expect(getPartyPrompts('would-you-rather', deck.map((prompt) => prompt.id))).toEqual(deck);
  });
});
