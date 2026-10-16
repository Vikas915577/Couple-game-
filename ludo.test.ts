import { describe, expect, it } from 'vitest';
import { chooseLudoBotToken, createLudoGame, globalTrackPosition, legalLudoTokens, moveLudoToken, rollLudoDie } from './ludo';

describe('Ludo rules', () => {
  it('starts four tokens in the yard for every player', () => {
    const game = createLudoGame(['You', 'Computer'], [false, true]);
    expect(game.players).toHaveLength(2);
    expect(game.players[0].tokens).toEqual([-1, -1, -1, -1]);
  });

  it('requires a six to leave the yard', () => {
    const game = createLudoGame(['A', 'B']);
    expect(legalLudoTokens(game, 5)).toEqual([]);
    expect(legalLudoTokens(game, 6)).toEqual([0, 1, 2, 3]);
  });

  it('rolls six to launch a token onto the track', () => {
    const game = createLudoGame(['A', 'B']);
    const rolled = rollLudoDie(game, 6);
    const moved = moveLudoToken(rolled, 0);
    expect(moved.players[0].tokens[0]).toBe(0);
    expect(moved.currentPlayerIndex).toBe(0);
  });

  it('rejects moving a token that was not legal for the current roll', () => {
    const game = createLudoGame(['A', 'B']);
    const withOneTokenOut = { ...game, players: game.players.map((player, index) => index === 0 ? { ...player, tokens: [0, -1, -1, -1] } : player) };
    const rolled = rollLudoDie(withOneTokenOut, 2);
    expect(rolled.legalTokenIndices).toEqual([0]);
    expect(() => moveLudoToken(rolled, 1)).toThrow(/cannot move/);
  });

  it('maps each player color onto a different starting square', () => {
    expect(globalTrackPosition('red', 0)).toBe(0);
    expect(globalTrackPosition('blue', 0)).toBe(13);
    expect(globalTrackPosition('green', 0)).toBe(26);
    expect(globalTrackPosition('yellow', 0)).toBe(39);
  });

  it('computer can choose a legal token after a six', () => {
    let game = createLudoGame(['A', 'Computer'], [false, true]);
    game = { ...game, currentPlayerIndex: 1 };
    game = rollLudoDie(game, 6);
    expect(chooseLudoBotToken(game)).toBeGreaterThanOrEqual(0);
  });
});
