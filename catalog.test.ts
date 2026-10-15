import { describe, expect, it } from 'vitest';
import { filterGames, games, isValidRoomCode, makeDemoRoomCode } from './catalog';

describe('game catalogue', () => {
  it('includes the planned first-release games', () => {
    const ids = games.filter((game) => game.status === 'mvp').map((game) => game.id);
    expect(ids).toContain('truth-dare-friends');
    expect(ids).toContain('couple-truth-dare');
    expect(ids).toContain('tic-tac-toe');
    expect(ids).toContain('would-you-rather');
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
