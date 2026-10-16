import { useEffect, useMemo, useState } from 'react';
import { Dice5, RefreshCw, ShieldCheck, Trophy, Users } from 'lucide-react';
import { chooseLudoBotToken, createLudoGame, globalTrackPosition, LUDO_SAFE_SQUARES, moveLudoToken, rollLudoDie, type LudoState } from '../lib/ludo';
import { loadOnlineLudo, moveOnlineLudoToken, removeOnlineLudoSubscription, resetOnlineLudo, rollOnlineLudoDie, startOnlineLudo, subscribeToOnlineLudo } from '../lib/ludo-online';

const side = 14;
const trackCells = (() => {
  const cells: Array<{ r: number; c: number }> = [];
  for (let c = 0; c < side; c++) cells.push({ r: 0, c });
  for (let r = 1; r < side; r++) cells.push({ r, c: side - 1 });
  for (let c = side - 2; c >= 0; c--) cells.push({ r: side - 1, c });
  for (let r = side - 2; r >= 1; r--) cells.push({ r, c: 0 });
  return cells;
})();
const trackIndex = new Map(trackCells.map((p, index) => [`${p.r},${p.c}`, index]));

interface RoomPlayer { user_id: string; display_name: string; }
interface Props {
  playerName: string;
  roomId?: string;
  myUserId?: string | null;
  roomPlayers?: RoomPlayer[];
  hostUserId?: string | null;
}

export function LudoPanel({ playerName, roomId, myUserId = null, roomPlayers = [], hostUserId = null }: Props) {
  const onlineMode = Boolean(roomId);
  const [vsComputer, setVsComputer] = useState(true);
  const [playerCount, setPlayerCount] = useState(2);
  const [localGame, setLocalGame] = useState<LudoState>(() => createLudoGame([playerName || 'You', 'Computer'], [false, true]));
  const [onlineGame, setOnlineGame] = useState<LudoState | null>(null);
  const [loadingOnline, setLoadingOnline] = useState(false);
  const [onlineError, setOnlineError] = useState('');
  const [working, setWorking] = useState(false);
  const game = onlineMode ? (onlineGame ?? localGame) : localGame;
  const currentPlayer = game.players[game.currentPlayerIndex];
  const isMyOnlineTurn = Boolean(onlineGame && currentPlayer?.id === myUserId);

  useEffect(() => {
    if (!roomId) { setOnlineGame(null); setOnlineError(''); return; }
    let cancelled = false;
    let channel: ReturnType<typeof subscribeToOnlineLudo> | null = null;
    const refresh = () => {
      void loadOnlineLudo(roomId).then((state) => { if (!cancelled) { setOnlineGame(state); setOnlineError(''); } })
        .catch((error: unknown) => { if (!cancelled) setOnlineError(error instanceof Error ? error.message : 'Could not sync Ludo.'); });
    };
    setLoadingOnline(true);
    void loadOnlineLudo(roomId).then((state) => {
      if (!cancelled) { setOnlineGame(state); setOnlineError(''); }
    }).catch((error: unknown) => {
      if (!cancelled) setOnlineError(error instanceof Error ? error.message : 'Could not sync Ludo.');
    }).finally(() => { if (!cancelled) setLoadingOnline(false); });
    channel = subscribeToOnlineLudo(roomId, refresh, (message) => { if (!cancelled) setOnlineError(`Live sync issue: ${message}. Refresh to reconnect.`); });
    return () => { cancelled = true; if (channel) void removeOnlineLudoSubscription(channel); };
  }, [roomId, roomPlayers.length]);

  const tokenCellMap = useMemo(() => {
    const result: Record<string, Array<{ color: string; label: string; index: number }>> = {};
    for (const player of game.players) player.tokens.forEach((progress, index) => {
      if (progress < 0 || progress > 51) return;
      const trackPos = globalTrackPosition(player.color, progress);
      if (trackPos === null) return;
      const cell = trackCells[trackPos]; if (!cell) return;
      const key = `${cell.r},${cell.c}`;
      (result[key] ??= []).push({ color: player.color, label: String(index + 1), index });
    });
    return result;
  }, [game.players]);

  function startNew() {
    const count = vsComputer ? 2 : playerCount;
    const names = vsComputer ? [playerName || 'You', 'Computer'] : Array.from({ length: count }, (_, i) => i === 0 ? (playerName || 'Player 1') : `Player ${i + 1}`);
    setLocalGame(createLudoGame(names, names.map((_, index) => vsComputer && index === 1)));
  }

  async function startOnline() {
    if (!roomId) return;
    setWorking(true); setOnlineError('');
    try { setOnlineGame(await startOnlineLudo(roomId)); }
    catch (error) { setOnlineError(error instanceof Error ? error.message : 'Could not start Ludo.'); }
    finally { setWorking(false); }
  }
  async function resetOnline() {
    if (!roomId) return;
    setWorking(true); setOnlineError('');
    try { setOnlineGame(await resetOnlineLudo(roomId)); }
    catch (error) { setOnlineError(error instanceof Error ? error.message : 'Could not reset Ludo.'); }
    finally { setWorking(false); }
  }
  async function roll() {
    if (onlineMode && roomId) {
      setWorking(true); setOnlineError('');
      try { setOnlineGame(await rollOnlineLudoDie(roomId)); }
      catch (error) { setOnlineError(error instanceof Error ? error.message : 'Could not roll the dice.'); }
      finally { setWorking(false); }
      return;
    }
    try { setLocalGame((state) => rollLudoDie(state)); } catch { /* Button is disabled while a roll awaits a move. */ }
  }
  async function move(index: number) {
    if (onlineMode && roomId) {
      setWorking(true); setOnlineError('');
      try { setOnlineGame(await moveOnlineLudoToken(roomId, index)); }
      catch (error) { setOnlineError(error instanceof Error ? error.message : 'Move rejected. Refresh and try again.'); }
      finally { setWorking(false); }
      return;
    }
    try { setLocalGame((state) => moveLudoToken(state, index)); } catch { /* stale taps are ignored */ }
  }

  useEffect(() => {
    if (onlineMode || !currentPlayer?.isComputer || game.winnerId) return;
    const timer = window.setTimeout(() => {
      setLocalGame((state) => {
        if (state.players[state.currentPlayerIndex]?.isComputer !== true || state.winnerId) return state;
        if (!state.rolled) return rollLudoDie(state);
        const token = chooseLudoBotToken(state);
        return token === null ? state : moveLudoToken(state, token);
      });
    }, game.rolled ? 650 : 800);
    return () => window.clearTimeout(timer);
  }, [onlineMode, currentPlayer?.id, currentPlayer?.isComputer, game.rolled, game.die, game.winnerId, game.turnNumber]);

  const yards = game.players.map((player) => ({ ...player, atHome: player.tokens.filter((p) => p === -1).length, finished: player.tokens.filter((p) => p === 58).length }));
  const onlineCanAct = onlineMode ? isMyOnlineTurn && !working && !game.winnerId : !currentPlayer?.isComputer;

  return <section className="ludo-panel" aria-label={onlineMode ? 'Ludo online multiplayer game' : 'Ludo local game'}>
    <div className="local-party-heading"><div><p className="eyebrow"><Dice5 size={14} /> NOW PLAYING · BOARD GAMES</p><h2>Ludo 🎲</h2><p>{onlineMode ? 'Play with friends on separate phones. Moves and dice are validated by the room backend.' : 'Race to home against the computer or pass the phone to friends.'}</p></div><span className="local-mode-pill">{onlineMode ? 'ONLINE ROOM' : 'LOCAL / BOT'}</span></div>

    {!onlineMode && <div className="ludo-setup"><div className="ludo-mode-tabs"><button className={vsComputer ? 'active' : ''} onClick={() => { setVsComputer(true); setPlayerCount(2); }}>Vs Computer</button><button className={!vsComputer ? 'active' : ''} onClick={() => setVsComputer(false)}>Same phone</button></div>{!vsComputer && <label className="field-label">Players <select className="form-input" value={playerCount} onChange={(e) => setPlayerCount(Number(e.target.value))}><option value={2}>2 players</option><option value={3}>3 players</option><option value={4}>4 players</option></select></label>}<button className="button button-secondary" onClick={startNew}><RefreshCw size={15} /> New game</button></div>}

    {onlineMode && !onlineGame && <div className="ludo-online-lobby"><div className="online-members-heading"><strong><Users size={16} /> Ludo players</strong><span>{roomPlayers.length}/4</span></div><p>{loadingOnline ? 'Checking game state…' : roomPlayers.length < 2 ? 'Invite at least one friend; the host can start after 2–4 players have joined.' : 'Players are ready. The room host can start the Ludo match.'}</p><div className="ludo-lobby-players">{roomPlayers.map((player) => <span key={player.user_id}>{player.display_name}{player.user_id === hostUserId ? ' · HOST' : ''}</span>)}</div>{roomPlayers.length >= 2 && myUserId === hostUserId && <button className="button button-primary" disabled={working} onClick={() => void startOnline()}><Dice5 size={16} /> {working ? 'Starting…' : 'Start online match'}</button>}</div>}

    <div className="ludo-status" role="status">{onlineMode && !onlineGame ? (loadingOnline ? 'Loading room state…' : 'Waiting in the lobby') : game.winnerId ? <><Trophy size={17} /> {game.message}</> : <><span className={`ludo-player-dot ${currentPlayer.color}`} /> {game.message}</>}</div>
    <div className={`ludo-board ${onlineMode && !onlineGame ? 'ludo-board-waiting' : ''}`} role="img" aria-label="Ludo board with token positions">
      {Array.from({ length: side * side }, (_, flat) => {
        const r = Math.floor(flat / side); const c = flat % side; const key = `${r},${c}`;
        const idx = trackIndex.get(key); const tokens = tokenCellMap[key] ?? [];
        const isHome = r >= 4 && r <= 9 && c >= 4 && c <= 9;
        const baseColor = r <= 3 && c <= 3 ? 'red' : r <= 3 && c >= 10 ? 'blue' : r >= 10 && c >= 10 ? 'green' : r >= 10 && c <= 3 ? 'yellow' : '';
        const safe = idx !== undefined && LUDO_SAFE_SQUARES.has(idx);
        return <div key={key} className={`ludo-cell ${idx !== undefined ? 'track' : ''} ${safe ? 'safe' : ''} ${baseColor ? `base ${baseColor}` : ''} ${isHome ? 'home-zone' : ''}`}>
          {idx !== undefined && <span className="ludo-track-number">{safe ? '✦' : ''}</span>}
          {isHome && r === 6 && c === 6 && <span className="ludo-finish">HOME</span>}
          {tokens.length > 0 && <span className={`ludo-token ${tokens[0].color}`}>{tokens.length > 1 ? tokens.length : tokens[0].label}</span>}
        </div>;
      })}
    </div>
    {!(onlineMode && !onlineGame) && <>
      <div className="ludo-players">{yards.map((player, index) => <div key={player.id} className={`ludo-player-card ${index === game.currentPlayerIndex ? 'active' : ''}`}><span className={`ludo-player-dot ${player.color}`} /><div><strong>{player.name}{player.isComputer ? ' · AI' : ''}</strong><small>{player.finished}/4 home · {player.atHome}/4 in yard</small></div></div>)}</div>
      {!game.winnerId && onlineCanAct && <div className="ludo-controls">{!game.rolled ? <button className="button button-primary" onClick={() => void roll()} disabled={working}><Dice5 size={17} /> {working ? 'Rolling…' : 'Roll dice'}</button> : <><div className="ludo-die">{game.die}</div><span>Choose a token:</span>{game.legalTokenIndices.map((index) => <button className="button button-secondary" key={index} disabled={working} onClick={() => void move(index)}>Move token {index + 1}</button>)}</>}</div>}
      {onlineMode && onlineGame && !isMyOnlineTurn && !game.winnerId && <p className="party-instruction">It is {currentPlayer?.name ?? 'another player'}’s turn. The board will update automatically.</p>}
      {game.winnerId && <button className="button button-primary" disabled={working} onClick={() => onlineMode ? void resetOnline() : startNew()}><RefreshCw size={16} /> Play again</button>}
      {onlineMode && onlineGame && myUserId === hostUserId && <button className="link-button" disabled={working} onClick={() => void resetOnline()}><RefreshCw size={13} /> Reset match (host)</button>}
    </>}
    {onlineError && <p className="chat-error" role="alert">{onlineError}</p>}
    <p className="local-party-safety"><ShieldCheck size={14} /> {onlineMode ? 'Private room members only · server-validated dice and moves · realtime reconnect' : 'Local-only game. Computer opponent and pass-the-phone modes work without extra setup.'}</p>
  </section>;
}
