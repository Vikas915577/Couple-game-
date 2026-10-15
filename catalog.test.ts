import { describe, expect, it } from 'vitest';
import { filterGames, games, isPlayableGame, isValidRoomCode, makeDemoRoomCode } from './catalog';

describe('game catalogue', () => {
  it('marks only working game modes as playable in V1', () => {
    const ids = games.filter((game) => game.status === 'mvp').map((game) => game.id);
    expect(ids.sort()).toEqual(['couple-truth-dare', 'tic-tac-toe', 'truth-dare-friends'].sort());
    expect(isPlayableGame('truth-dare-friends')).toBe(true);
    expect(isPlayableGame('couple-truth-dare')).toBe(true);
    expect(isPlayableGame('tic-tac-toe')).toBe(true);
    expect(isPlayableGame('would-you-rather')).toBe(false);
    expect(isPlayableGame('partner-quiz')).toBe(false);
    expect(isPlayableGame('ludo')).toBe(false);
    expect(games.filter((game) => game.status === 'mvp').every((game) => isPlayableGame(game.id))).toBe(true);
  });

  it('filters by category', () => {
    const result = filterGames(games, 'couples', '');
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((game) => game.category === 'couples')).toBe(true);
  });

  it('searches names, descriptions and tags case-insensitively', () => {
    expect(filterGames(games, 'all', 'CHESS').map((game) => game.id)).toContain('chess');
    expect(filterGames(games, 'all', 'date night').length).toBeGreaterThan(0);
  });

  it('validates invite codes with 6–8 letters or digits', () => {
    expect(isValidRoomCode('abc234')).toBe(true);
    expect(isValidRoomCode('AB-23')).toBe(false);
    expect(isValidRoomCode('12345')).toBe(false);
    expect(isValidRoomCode('12345678')).toBe(true);
    expect(isValidRoomCode('123456789')).toBe(false);
    expect(isValidRoomCode('')).toBe(false);
  });

  it('creates a six-character demo room code', () => {
    expect(makeDemoRoomCode(0)).toHaveLength(6);
    expect(makeDemoRoomCode(0.5)).toMatch(/^[A-HJ-NP-Z2-9]{6}$/);
  });
});
