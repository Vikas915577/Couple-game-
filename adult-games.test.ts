import { describe, expect, it } from 'vitest';
import { adultHubGames, getAdultHubGames } from './adult-games';
import { games } from './catalog';

describe('Adults 18+ hub', () => {
  it('keeps coming-soon adult games distinct from playable ones', () => {
    expect(getAdultHubGames('playable')).toHaveLength(2);
    expect(getAdultHubGames('coming-soon')).toHaveLength(5);
    expect(adultHubGames.every((game) => game.status === 'playable' || game.status === 'coming-soon')).toBe(true);
  });

  it('only playable adult cards link to existing game routes', () => {
    for (const game of getAdultHubGames('playable')) {
      expect(game.linkedGameId).toBeTruthy();
      expect(games.some((catalogGame) => catalogGame.id === game.linkedGameId && catalogGame.status === 'mvp')).toBe(true);
    }
    for (const game of getAdultHubGames('coming-soon')) {
      expect(game.linkedGameId).toBeUndefined();
    }
  });

  it('has unique, stable card ids', () => {
    const ids = adultHubGames.map((game) => game.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
