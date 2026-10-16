import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  Bell,
  Check,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  ClipboardCheck,
  Copy,
  Gamepad2,
  Flame,
  Heart,
  House,
  LockKeyhole,
  Menu,
  Plus,
  RefreshCw,
  Trophy,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  Users,
  X,
  Zap,
} from 'lucide-react';
import {
  categoryLabels,
  filterGames,
  games,
  isValidRoomCode,
  isPlayableGame,
  isOnlineGame,
  makeDemoRoomCode,
  type GameCategory,
  type GameDefinition,
} from './catalog';
import { isSupabaseConfigured } from './lib/supabase';
import {
  createOnlineRoom,
  ensureGuestSession,
  joinOnlineRoom,
  leaveOnlineRoom,
  listMyOnlineRooms,
  loadOnlineRoom,
  removeRoomSubscription,
  subscribeToRoom,
  type OnlineRoomState,
} from './lib/rooms';
import { applyMove, emptyBoard, findWinningLine, getResultStatus, markForUser, type Board, type Mark, type TicTacToeState } from './lib/tic-tac-toe';
import { loadTicTacToe, removeTicTacToeSubscription, requestTicTacToeRematch, startOrLoadTicTacToe, submitTicTacToeMove, subscribeToTicTacToe } from './lib/tic-tac-toe-online';
import { drawPrompt, promptPackLabels, type DareMode, type Prompt, type PromptKind, type PromptPack } from './lib/truth-or-dare';
import { chooseOnlineTruthOrDare, loadTruthOrDare, removeTruthOrDareSubscription, resolveOnlineTruthOrDare, startOrLoadTruthOrDare, subscribeToTruthOrDare, type OnlineTruthOrDareState } from './lib/truth-or-dare-online';
import { chooseComputerMove, type AiDifficulty } from './lib/tic-tac-toe-ai';
import { RoomChat } from './components/RoomChat';
import { LocalPartyGamePanel } from './components/LocalPartyGamePanel';
import { LudoPanel } from './components/LudoPanel';
import { adultHubGames, type AdultHubGame } from './adult-games';

type Navigation = 'Home' | 'Games' | 'Rooms' | 'Adults' | 'Profile';
type Modal = 'create' | 'join' | 'created' | 'game' | null;

interface DemoRoom {
  id?: string;
  mode: 'demo' | 'online';
  code: string;
  gameId: string;
  gameName: string;
  roomName: string;
  createdAt: string;
  maxPlayers: number;
  status?: 'open' | 'closed';
}

const navigation: { label: Navigation; icon: typeof House }[] = [
  { label: 'Home', icon: House },
  { label: 'Games', icon: Gamepad2 },
  { label: 'Rooms', icon: Users },
  { label: 'Adults', icon: Flame },
  { label: 'Profile', icon: Heart },
];

const categoryOrder: GameCategory[] = ['all', 'board', 'friends', 'couples'];

function App() {
  const [activeNav, setActiveNav] = useState<Navigation>('Home');
  const [activeCategory, setActiveCategory] = useState<GameCategory>('all');
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<Modal>(null);
  const [selectedGame, setSelectedGame] = useState<GameDefinition>(games[0]);
  const [createGameId, setCreateGameId] = useState('truth-dare-friends');
  const [roomName, setRoomName] = useState('Friday night gang');
  const [joinCode, setJoinCode] = useState('');
  const [rooms, setRooms] = useState<DemoRoom[]>([]);
  const [currentRoom, setCurrentRoom] = useState<DemoRoom | null>(null);
  const [onlineRoomState, setOnlineRoomState] = useState<OnlineRoomState | null>(null);
  const [playerName, setPlayerName] = useState(() => {
    try { return window.localStorage.getItem('yaarjam-player-name') || 'Guest'; } catch { return 'Guest'; }
  });
  const [backendStatus, setBackendStatus] = useState<'checking' | 'demo' | 'online' | 'error'>(isSupabaseConfigured ? 'checking' : 'demo');
  const [working, setWorking] = useState(false);
  const [notice, setNotice] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [tttOnlineState, setTttOnlineState] = useState<TicTacToeState | null>(null);
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [tttDemoBoard, setTttDemoBoard] = useState<Board>(() => emptyBoard());
  const [tttDemoTurn, setTttDemoTurn] = useState<Mark>('X');
  const [tttDemoStatus, setTttDemoStatus] = useState<'playing' | 'x_won' | 'o_won' | 'draw'>('playing');
  const [tttWorking, setTttWorking] = useState(false);
  const [tttError, setTttError] = useState('');
  const [tttOpponent, setTttOpponent] = useState<'friend' | 'computer'>('computer');
  const [tttDifficulty, setTttDifficulty] = useState<AiDifficulty>('medium');
  const [darePack, setDarePack] = useState<PromptPack>('classic');
  const [adultConfirmed, setAdultConfirmed] = useState(false);
  const [adultSectionUnlocked, setAdultSectionUnlocked] = useState(false);
  const [darePrompt, setDarePrompt] = useState<Prompt | null>(null);
  const [dareUsedIds, setDareUsedIds] = useState<string[]>([]);
  const [dareTurn, setDareTurn] = useState(0);
  const [dareCompleted, setDareCompleted] = useState(0);
  const [dareSkipped, setDareSkipped] = useState(0);
  const [dareOnlineState, setDareOnlineState] = useState<OnlineTruthOrDareState | null>(null);
  const [dareWorking, setDareWorking] = useState(false);
  const [dareError, setDareError] = useState('');

  const visibleGames = useMemo(() => filterGames(games, activeCategory, search), [activeCategory, search]);
  const mvpCount = games.filter((game) => game.status === 'mvp').length;

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let cancelled = false;
    const roomFromLink = new URLSearchParams(window.location.search).get('room');

    void (async () => {
      try {
        const userId = await ensureGuestSession();
        setMyUserId(userId);
        const savedRooms = await listMyOnlineRooms(userId);
        if (cancelled) return;
        setBackendStatus('online');
        if (roomFromLink) {
          setJoinCode(roomFromLink.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8));
          setModal('join');
          return;
        }
        if (savedRooms.length > 0) {
          const latest = savedRooms[0];
          setOnlineRoomState(latest);
          const game = games.find((item) => item.id === latest.room.game_id);
          const restoredRoom: DemoRoom = {
            id: latest.room.id,
            mode: 'online',
            code: latest.room.code,
            gameId: latest.room.game_id,
            gameName: game?.name ?? latest.room.game_id,
            roomName: latest.room.room_name,
            createdAt: new Date(latest.room.created_at).toLocaleString(),
            maxPlayers: latest.room.max_players,
            status: latest.room.status,
          };
          setCurrentRoom(restoredRoom);
          setRooms((current) => [
            restoredRoom,
            ...current.filter((room) => room.id !== restoredRoom.id),
          ].slice(0, 8));
        }
      } catch (error) {
        if (!cancelled) {
          setBackendStatus('error');
          setNotice(error instanceof Error ? error.message : 'Could not connect to Supabase. Check configuration and SQL setup.');
        }
      }
    })();

    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!onlineRoomState?.room.id || backendStatus !== 'online') return;
    let cancelled = false;
    const roomId = onlineRoomState.room.id;
    const channel = subscribeToRoom(
      roomId,
      () => {
        void loadOnlineRoom(roomId).then((state) => {
          if (!cancelled) setOnlineRoomState(state);
        }).catch((error: unknown) => {
          if (!cancelled) setNotice(error instanceof Error ? error.message : 'Could not refresh room members.');
        });
      },
      (message) => { if (!cancelled) setNotice(`Realtime connection issue: ${message}. Refresh to reconnect.`); },
    );
    return () => {
      cancelled = true;
      void removeRoomSubscription(channel);
    };
  }, [onlineRoomState?.room.id, backendStatus]);

  useEffect(() => {
    const roomId = onlineRoomState?.room.game_id === 'tic-tac-toe' ? onlineRoomState.room.id : null;
    if (!roomId || backendStatus !== 'online') {
      setTttOnlineState(null);
      setMyUserId(null);
      setTttError('');
      return;
    }

    let cancelled = false;
    let channel: ReturnType<typeof subscribeToTicTacToe> | null = null;
    const refreshGame = () => {
      void loadTicTacToe(roomId).then((state) => {
        if (!cancelled) setTttOnlineState(state);
      }).catch((error: unknown) => {
        if (!cancelled) setTttError(error instanceof Error ? error.message : 'Could not sync the game.');
      });
    };

    void (async () => {
      try {
        const userId = await ensureGuestSession();
        if (cancelled) return;
        setMyUserId(userId);
        const state = await startOrLoadTicTacToe(roomId);
        if (cancelled) return;
        setTttOnlineState(state);
        channel = subscribeToTicTacToe(roomId, refreshGame, (message) => {
          if (!cancelled) setTttError(`Game sync issue: ${message}. Refresh the page to reconnect.`);
        });
      } catch (error) {
        if (!cancelled) setTttError(error instanceof Error ? error.message : 'Could not start Tic Tac Toe. Check the YaarJam V1 SQL setup (`supabase/schema.sql`).');
      }
    })();

    return () => {
      cancelled = true;
      if (channel) void removeTicTacToeSubscription(channel);
    };
  }, [onlineRoomState?.room.id, onlineRoomState?.room.game_id, onlineRoomState?.players.length, backendStatus]);

  useEffect(() => {
    if (currentRoom?.mode === 'demo' && currentRoom.gameId === 'tic-tac-toe') {
      setTttDemoBoard(emptyBoard());
      setTttDemoTurn('X');
      setTttDemoStatus('playing');
      setTttError('');
    }
  }, [currentRoom?.code, currentRoom?.mode, currentRoom?.gameId]);

  useEffect(() => {
    if (currentRoom?.mode !== 'demo' || currentRoom.gameId !== 'tic-tac-toe' || tttOpponent !== 'computer' || tttDemoTurn !== 'O' || tttDemoStatus !== 'playing') return;
    const timer = window.setTimeout(() => {
      const index = chooseComputerMove(tttDemoBoard, 'O', tttDifficulty);
      if (index === null) return;
      const next = [...tttDemoBoard] as Board;
      next[index] = 'O';
      setTttDemoBoard(next);
      setTttDemoStatus(getResultStatus(next) as 'playing' | 'x_won' | 'o_won' | 'draw');
      setTttDemoTurn('X');
    }, 420);
    return () => window.clearTimeout(timer);
  }, [currentRoom?.code, currentRoom?.mode, currentRoom?.gameId, tttOpponent, tttDifficulty, tttDemoBoard, tttDemoTurn, tttDemoStatus]);

  const isDareGame = currentRoom?.gameId === 'truth-dare-friends' || currentRoom?.gameId === 'couple-truth-dare';
  const dareMode: DareMode = currentRoom?.gameId === 'couple-truth-dare' ? 'couples' : 'friends';
  const darePlayers = dareMode === 'couples' ? ['Partner 1', 'Partner 2'] : ['Player 1', 'Player 2', 'Player 3', 'Player 4'];
  const hasOnlineDare = Boolean(currentRoom?.mode === 'online' && isDareGame);

  useEffect(() => {
    const roomId = onlineRoomState && ['truth-dare-friends', 'couple-truth-dare'].includes(onlineRoomState.room.game_id)
      ? onlineRoomState.room.id
      : null;
    if (!roomId || backendStatus !== 'online') {
      setDareOnlineState(null);
      setDareError('');
      return;
    }

    let cancelled = false;
    let channel: ReturnType<typeof subscribeToTruthOrDare> | null = null;
    const refreshGame = () => {
      void loadTruthOrDare(roomId).then((state) => {
        if (!cancelled) setDareOnlineState(state);
      }).catch((error: unknown) => {
        if (!cancelled) setDareError(error instanceof Error ? error.message : 'Could not sync the shared round.');
      });
    };

    void (async () => {
      try {
        const userId = await ensureGuestSession();
        if (cancelled) return;
        setMyUserId(userId);
        const state = await startOrLoadTruthOrDare(roomId);
        if (cancelled) return;
        setDareOnlineState(state);
        channel = subscribeToTruthOrDare(roomId, refreshGame, (message) => {
          if (!cancelled) setDareError(`Realtime sync issue: ${message}. Refresh to reconnect.`);
        });
      } catch (error) {
        if (!cancelled) {
          setDareOnlineState(null);
          setDareError(error instanceof Error ? error.message : 'Could not start shared Truth or Dare. Check the YaarJam V1 Supabase schema (`supabase/schema.sql`).');
        }
      }
    })();

    return () => {
      cancelled = true;
      if (channel) void removeTruthOrDareSubscription(channel);
    };
  }, [onlineRoomState?.room.id, onlineRoomState?.room.game_id, onlineRoomState?.players.length, backendStatus]);

  useEffect(() => {
    if (!isDareGame) return;
    setDarePrompt(null);
    setDareUsedIds([]);
    setDareTurn(0);
    setDareCompleted(0);
    setDareSkipped(0);
    setDarePack('classic');
    setAdultConfirmed(false);
    setDareError('');
  }, [currentRoom?.code, currentRoom?.gameId, isDareGame]);

  const displayedDarePrompt: Prompt | null = hasOnlineDare
    ? (dareOnlineState?.current_prompt_id && dareOnlineState.current_prompt_kind && dareOnlineState.current_prompt_text
      ? { id: dareOnlineState.current_prompt_id, mode: dareOnlineState.mode, kind: dareOnlineState.current_prompt_kind, text: dareOnlineState.current_prompt_text }
      : null)
    : darePrompt;
  const displayedDareTurn = hasOnlineDare ? (dareOnlineState?.current_turn_index ?? 0) : dareTurn;
  const displayedDareCompleted = hasOnlineDare ? (dareOnlineState?.completed_count ?? 0) : dareCompleted;
  const displayedDareSkipped = hasOnlineDare ? (dareOnlineState?.skipped_count ?? 0) : dareSkipped;
  const displayedDareCurrentPlayer = hasOnlineDare
    ? (dareOnlineState?.current_turn_user_id ? onlineRoomState?.players.find((player) => player.user_id === dareOnlineState.current_turn_user_id)?.display_name ?? 'Player' : 'Connecting…')
    : (darePlayers[dareTurn] ?? 'Player');
  const isMyDareTurn = !hasOnlineDare || Boolean(dareOnlineState && myUserId && dareOnlineState.current_turn_user_id === myUserId);
  const canChooseDare = hasOnlineDare
    ? Boolean(dareOnlineState && dareOnlineState.player_order.length >= 2 && isMyDareTurn && !displayedDarePrompt && !dareWorking)
    : true;
  const canResolveDare = hasOnlineDare
    ? Boolean(dareOnlineState && dareOnlineState.player_order.length >= 2 && isMyDareTurn && displayedDarePrompt && !dareWorking)
    : Boolean(displayedDarePrompt);

  async function pickDarePrompt(kind: PromptKind) {
    setDareError('');
    if ((darePack === 'spicy' || darePack === 'after-dark') && !adultConfirmed) {
      setDareError('Please confirm you are 18+ before choosing an adult pack.');
      return;
    }
    if (hasOnlineDare) {
      if (!onlineRoomState || !dareOnlineState) {
        setDareError('The shared game is still connecting. Wait a moment and try again.');
        return;
      }
      if (dareOnlineState.player_order.length < 2) {
        setDareError('Invite at least one more player before starting a round.');
        return;
      }
      if (dareOnlineState.current_turn_user_id !== myUserId) {
        setDareError('It is another player’s turn. You will see the shared prompt when they choose.');
        return;
      }
      setDareWorking(true);
      try {
        const state = await chooseOnlineTruthOrDare(onlineRoomState.room.id, kind, darePack);
        setDareOnlineState(state);
      } catch (error) {
        setDareError(error instanceof Error ? error.message : 'Could not select a shared prompt.');
      } finally {
        setDareWorking(false);
      }
      return;
    }

    const next = drawPrompt(dareMode, kind, dareUsedIds, Math.random(), darePack);
    if (!next) { setDareError('No prompts in this pack for this mode yet. Choose another pack.'); return; }
    if (!next) return;
    setDarePrompt(next);
    setDareUsedIds((ids) => ids.includes(next.id) ? [next.id] : [...ids, next.id]);
  }

  async function finishDareTurn(skipped: boolean) {
    setDareError('');
    if (hasOnlineDare) {
      if (!onlineRoomState || !dareOnlineState || !displayedDarePrompt) return;
      if (dareOnlineState.current_turn_user_id !== myUserId) {
        setDareError('Only the current player can finish or skip this prompt.');
        return;
      }
      setDareWorking(true);
      try {
        const state = await resolveOnlineTruthOrDare(onlineRoomState.room.id, skipped);
        setDareOnlineState(state);
      } catch (error) {
        setDareError(error instanceof Error ? error.message : 'Could not resolve this prompt.');
      } finally {
        setDareWorking(false);
      }
      return;
    }
    if (!darePrompt) return;
    if (skipped) setDareSkipped((count) => count + 1);
    else setDareCompleted((count) => count + 1);
    setDareTurn((turn) => (turn + 1) % darePlayers.length);
    setDarePrompt(null);
  }

  const hasOnlineTtt = onlineRoomState?.room.game_id === 'tic-tac-toe';
  const shownTttState = hasOnlineTtt ? tttOnlineState : null;
  const shownTttBoard = shownTttState?.board ?? (hasOnlineTtt ? emptyBoard() : tttDemoBoard);
  const shownTttStatus = shownTttState?.status ?? (hasOnlineTtt ? 'waiting' : tttDemoStatus);
  const shownTttWinningLine = findWinningLine(shownTttBoard);
  const myTttMark = shownTttState ? markForUser(shownTttState, myUserId) : null;
  const tttCanMove = hasOnlineTtt
    ? Boolean(shownTttState && shownTttState.status === 'playing' && myTttMark && shownTttState.current_turn_user_id === myUserId && !tttWorking)
    : Boolean(currentRoom?.mode === 'demo' && currentRoom.gameId === 'tic-tac-toe' && tttDemoStatus === 'playing' && !tttWorking && (tttOpponent === 'friend' || tttDemoTurn === 'X'));

  async function handleTttMove(index: number) {
    setTttError('');
    if (hasOnlineTtt && onlineRoomState) {
      if (!tttOnlineState || !myTttMark || tttOnlineState.current_turn_user_id !== myUserId) {
        setTttError('It is not your turn yet, or a second player has not joined.');
        return;
      }
      setTttWorking(true);
      try {
        const state = await submitTicTacToeMove(onlineRoomState.room.id, index);
        setTttOnlineState(state);
      } catch (error) {
        setTttError(error instanceof Error ? error.message : 'Move rejected. Refresh and try again.');
      } finally {
        setTttWorking(false);
      }
      return;
    }

    if (!currentRoom || currentRoom.mode !== 'demo' || currentRoom.gameId !== 'tic-tac-toe') return;
    try {
      const nextBoard = applyMove(tttDemoBoard, index, tttDemoTurn);
      const result = getResultStatus(nextBoard);
      setTttDemoBoard(nextBoard);
      setTttDemoStatus(result === 'waiting' ? 'playing' : result);
      if (result === 'playing') setTttDemoTurn(tttDemoTurn === 'X' ? 'O' : 'X');
    } catch (error) {
      setTttError(error instanceof Error ? error.message : 'That move is not allowed.');
    }
  }

  async function handleTttRematch() {
    setTttError('');
    if (hasOnlineTtt && onlineRoomState) {
      setTttWorking(true);
      try {
        const state = await requestTicTacToeRematch(onlineRoomState.room.id);
        setTttOnlineState(state);
      } catch (error) {
        setTttError(error instanceof Error ? error.message : 'Could not request a rematch.');
      } finally {
        setTttWorking(false);
      }
      return;
    }
    setTttDemoBoard(emptyBoard());
    setTttDemoTurn(tttOpponent === 'computer' ? 'X' : (tttDemoTurn === 'X' ? 'O' : 'X'));
    setTttDemoStatus('playing');
  }

  function goTo(destination: Navigation) {
    setActiveNav(destination);
    setMobileMenuOpen(false);
    setNotice('');
    if (destination === 'Games') {
      setActiveCategory('all');
    }
  }

  function openCreate(game?: GameDefinition) {
    if (game) setCreateGameId(game.id);
    setModal('create');
    setNotice('');
  }

  function rememberPlayerName(value: string) {
    const cleaned = value.slice(0, 18);
    setPlayerName(cleaned);
    try { window.localStorage.setItem('yaarjam-player-name', cleaned); } catch { /* Private browsing may block local storage. */ }
  }

  function maxPlayersForGame(game: GameDefinition): number {
    if (['couples', 'tic-tac-toe', 'chess'].includes(game.category) || game.id === 'tic-tac-toe' || game.id === 'chess') return 2;
    if (game.id === 'ludo') return 4;
    return 10;
  }

  async function handleCreateRoom() {
    const game = games.find((item) => item.id === createGameId) ?? games[0];
    if (!isPlayableGame(game.id)) {
      setNotice(`${game.name} is planned for a future update. Choose Tic Tac Toe or Truth or Dare in V1.`);
      return;
    }
    const cleanRoomName = roomName.trim().slice(0, 36) || 'Game night';
    const cleanPlayerName = playerName.trim().slice(0, 18) || 'Guest';
    setWorking(true);
    setNotice('');
    try {
      if (!isSupabaseConfigured || !isOnlineGame(game.id)) {
        const room: DemoRoom = {
          mode: 'demo',
          code: makeDemoRoomCode(),
          gameId: game.id,
          gameName: game.name,
          roomName: cleanRoomName,
          createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          maxPlayers: maxPlayersForGame(game),
          status: 'open',
        };
        setRooms((current) => [room, ...current].slice(0, 8));
        setCurrentRoom(room);
        setOnlineRoomState(null);
        setModal('created');
        setActiveNav('Rooms');
        if (!isSupabaseConfigured) setBackendStatus('demo');
        if (isSupabaseConfigured && !isOnlineGame(game.id)) setNotice(`${game.name} is playable on this device in V1.1; online state sync for this game is still in development.`);
        return;
      }

      const state = await createOnlineRoom({
        roomName: cleanRoomName,
        gameId: game.id,
        displayName: cleanPlayerName,
        maxPlayers: maxPlayersForGame(game),
      });
      const room: DemoRoom = {
        id: state.room.id,
        mode: 'online',
        code: state.room.code,
        gameId: state.room.game_id,
        gameName: game.name,
        roomName: state.room.room_name,
        createdAt: new Date(state.room.created_at).toLocaleString(),
        maxPlayers: state.room.max_players,
        status: state.room.status,
      };
      setOnlineRoomState(state);
      setRooms((current) => [room, ...current.filter((item) => item.id !== room.id)].slice(0, 8));
      setCurrentRoom(room);
      setModal('created');
      setActiveNav('Rooms');
      setBackendStatus('online');
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Could not create room. Check Supabase setup and try again.');
    } finally {
      setWorking(false);
    }
  }

  async function handleJoinRoom() {
    const normalized = joinCode.trim().toUpperCase();
    if (!isValidRoomCode(normalized)) {
      setNotice('Enter a room code with 6–8 letters or numbers.');
      return;
    }

    if (!isSupabaseConfigured) {
      const localRoom = rooms.find((room) => room.code === normalized);
      if (localRoom) {
        setCurrentRoom(localRoom);
        setModal(null);
        setActiveNav('Rooms');
        setNotice('This is a local demo room on this browser only. Add Supabase settings for friends to join from other devices.');
      } else {
        setNotice('Live joining needs Supabase setup. This preview can only recognize demo rooms created in this same browser session.');
      }
      return;
    }

    setWorking(true);
    setNotice('');
    try {
      const state = await joinOnlineRoom(normalized, playerName.trim() || 'Guest');
      const game = games.find((item) => item.id === state.room.game_id);
      const room: DemoRoom = {
        id: state.room.id,
        mode: 'online',
        code: state.room.code,
        gameId: state.room.game_id,
        gameName: game?.name ?? state.room.game_id,
        roomName: state.room.room_name,
        createdAt: new Date(state.room.created_at).toLocaleString(),
        maxPlayers: state.room.max_players,
        status: state.room.status,
      };
      setOnlineRoomState(state);
      setCurrentRoom(room);
      setRooms((current) => [room, ...current.filter((item) => item.id !== room.id)].slice(0, 8));
      setBackendStatus('online');
      setActiveNav('Rooms');
      setModal(null);
      setJoinCode('');
      setNotice(`Joined ${state.room.room_name}. Your lobby updates in real time.`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Could not join room. Check the code and backend setup.');
    } finally {
      setWorking(false);
    }
  }

  async function handleLeaveRoom() {
    if (!onlineRoomState) return;
    setWorking(true);
    try {
      await leaveOnlineRoom(onlineRoomState.room.id);
      const leftId = onlineRoomState.room.id;
      setOnlineRoomState(null);
      setCurrentRoom(null);
      setRooms((current) => current.filter((room) => room.id !== leftId));
      setNotice('You left the room.');
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Could not leave the room.');
    } finally {
      setWorking(false);
    }
  }

  async function copyText(text: string, successMessage: string) {
    try {
      await navigator.clipboard.writeText(text);
      setNotice(successMessage);
    } catch {
      setNotice('Copy was blocked by this browser. You can select the text and copy it manually.');
    }
  }

  function selectGame(game: GameDefinition) {
    setSelectedGame(game);
    setModal('game');
    setNotice('');
  }

  const inviteLink = currentRoom ? `${window.location.origin}${window.location.pathname}?room=${currentRoom.code}` : '';
  const backendPill = backendStatus === 'online' ? 'LIVE ROOMS' : backendStatus === 'checking' ? 'CONNECTING…' : backendStatus === 'error' ? 'SETUP NEEDED' : 'DEMO MODE';
  const tttXPlayerName = shownTttState && onlineRoomState?.players.find((player) => player.user_id === shownTttState.x_user_id)?.display_name || 'Player X';
  const tttOPlayerName = shownTttState && onlineRoomState?.players.find((player) => player.user_id === shownTttState.o_user_id)?.display_name || 'Player O';
  const tttStatusMessage = hasOnlineTtt
    ? !shownTttState
      ? 'Connecting to the game…'
      : shownTttState.status === 'waiting'
        ? 'Waiting for one more player to join this room.'
        : shownTttState.status === 'draw'
          ? 'It’s a draw! Both players played well.'
          : shownTttState.status === 'x_won'
            ? `${tttXPlayerName} wins this round!`
            : shownTttState.status === 'o_won'
              ? `${tttOPlayerName} wins this round!`
              : shownTttState.current_turn_user_id === myUserId
                ? `Your turn — you are ${myTttMark ?? 'a player'}.`
                : `${shownTttState.current_turn_user_id === shownTttState.x_user_id ? tttXPlayerName : tttOPlayerName} is thinking…`
    : tttDemoStatus === 'draw'
      ? 'It’s a draw!'
      : tttDemoStatus === 'x_won'
        ? 'X wins this round!'
        : tttDemoStatus === 'o_won'
          ? 'O wins this round!'
          : `Demo match · ${tttDemoTurn}'s turn — pass the phone between players.`;

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileMenuOpen ? 'sidebar-open' : ''}`}>
        <button className="brand-lockup" onClick={() => goTo('Home')} aria-label="YaarJam home">
          <span className="brand-mark"><Gamepad2 size={23} strokeWidth={2.4} /></span>
          <span className="brand-type">Yaar<span>Jam</span><small>APNE LOG. APNA GAME.</small></span>
        </button>

        <div className="side-section-label">YOUR SPACE</div>
        <nav className="side-nav" aria-label="Main navigation">
          {navigation.map(({ label, icon: Icon }) => (
            <button key={label} className={`nav-item ${activeNav === label ? 'active' : ''}`} onClick={() => goTo(label)}>
              <Icon size={19} strokeWidth={2} />
              <span>{label === 'Adults' ? 'Adults 18+' : label}</span>
              {label === 'Rooms' && rooms.length > 0 && <span className="nav-count">{rooms.length}</span>}
              {activeNav === label && <span className="nav-active-dot" />}
            </button>
          ))}
        </nav>

        <div className="side-section-label side-label-games">GAME ZONES</div>
        <nav className="side-nav category-nav" aria-label="Game categories">
          <button className={`nav-item ${activeCategory === 'board' && activeNav === 'Games' ? 'active' : ''}`} onClick={() => { setMobileMenuOpen(false); setNotice(''); setActiveNav('Games'); setActiveCategory('board'); }}><span className="nav-emoji">🎲</span><span>Board games</span></button>
          <button className={`nav-item ${activeCategory === 'friends' && activeNav === 'Games' ? 'active' : ''}`} onClick={() => { setMobileMenuOpen(false); setNotice(''); setActiveNav('Games'); setActiveCategory('friends'); }}><span className="nav-emoji">🎉</span><span>Friends & party</span></button>
          <button className={`nav-item ${activeCategory === 'couples' && activeNav === 'Games' ? 'active' : ''}`} onClick={() => { setMobileMenuOpen(false); setNotice(''); setActiveNav('Games'); setActiveCategory('couples'); }}><span className="nav-emoji">💗</span><span>Couples corner</span><span className="tiny-new">NEW</span></button>
        </nav>

        <div className="sidebar-bottom">
          <div className="invite-mini">
            <div className="invite-mini-icon"><Users size={18} /></div>
            <strong>Good times are better together.</strong>
            <p>Create a room and bring your people in.</p>
            <button onClick={() => openCreate()} className="mini-cta">Create a room <ArrowRight size={14} /></button>
          </div>
          <div className="profile-mini">
            <div className="avatar avatar-small">Y</div>
            <div><strong>{playerName || 'Guest player'}</strong><span>{backendStatus === 'online' ? 'Guest session connected' : 'Local preview guest'}</span></div>
            <Settings2 size={17} className="profile-gear" aria-hidden="true" />
          </div>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <button className="mobile-menu-button icon-button" aria-label="Toggle navigation" onClick={() => setMobileMenuOpen((open) => !open)}><Menu size={21} /></button>
          <div className="breadcrumbs"><span>YaarJam</span><ChevronRight size={14} /><strong>{activeNav === 'Home' ? 'Your space' : activeNav}</strong></div>
          <div className="top-actions">
            <span className={`demo-pill ${backendStatus === 'online' ? 'live-pill' : backendStatus === 'error' ? 'error-pill' : ''}`}><span /> {backendPill}</span>
            <button className="icon-button notification-button" aria-label="Notifications" onClick={() => setNotice('Notifications will be added in a later phase.')}><Bell size={19} /><i /></button>
            <button className="avatar avatar-top" aria-label="Open guest profile" onClick={() => goTo('Profile')}>Y</button>
          </div>
        </header>

        <div className="page-content">
          {activeNav === 'Home' && (
            <>
              <section className="welcome-row">
                <div>
                  <p className="eyebrow"><Sparkles size={14} /> YOUR LITTLE CORNER OF FUN</p>
                  <h1>Good games.<br /><span>Better company.</span></h1>
                  <p className="welcome-copy">Your people are just one room away. Pick a game and let the fun begin.</p>
                  <div className="welcome-actions">
                    <button className="button button-primary" onClick={() => goTo('Games')}>Explore games <ArrowRight size={17} /></button>
                    <button className="button button-secondary" onClick={() => { setModal('join'); setNotice(''); }}>Join with a code <Users size={16} /></button>
                  </div>
                </div>
                <div className="hero-art" aria-label="Illustration representing friends playing games">
                  <div className="hero-glow" />
                  <div className="orbit orbit-one" /><div className="orbit orbit-two" />
                  <div className="float-card float-card-one"><span>🎲</span><b>ROLL</b></div>
                  <div className="float-card float-card-two"><span>💗</span><b>CONNECT</b></div>
                  <div className="float-card float-card-three"><span>♟️</span><b>THINK</b></div>
                  <div className="hero-console"><Gamepad2 size={66} strokeWidth={1.5} /><span className="console-dot dot-one" /><span className="console-dot dot-two" /><span className="console-plus">+</span><span className="console-circle">●</span></div>
                  <div className="hero-spark spark-one">✦</div><div className="hero-spark spark-two">✧</div><div className="hero-spark spark-three">✦</div>
                </div>
              </section>

              <section className="quick-stats" aria-label="Project highlights">
                <div className="quick-stat"><span className="stat-icon stat-purple"><Gamepad2 size={17} /></span><div><strong>{games.length} games listed</strong><span>Across 4 game zones</span></div></div>
                <div className="quick-stat"><span className="stat-icon stat-peach"><Heart size={17} /></span><div><strong>Couples corner</strong><span>Made for two</span></div></div>
                <div className="quick-stat"><span className="stat-icon stat-green"><ShieldCheck size={17} /></span><div><strong>Private rooms</strong><span>Invite friends to play</span></div></div>
              </section>

              <section className="section-block featured-block">
                <div className="section-heading"><div><p className="eyebrow">START HERE</p><h2>Pick your kind of fun</h2><p className="section-subtitle">A little competition, a little chaos, a lot of laughs.</p></div><button className="text-button" onClick={() => goTo('Games')}>View all games <ArrowRight size={16} /></button></div>
                <div className="zone-grid">
                  <button className="zone-card zone-board" onClick={() => { setActiveCategory('board'); setActiveNav('Games'); }}><span className="zone-icon">🎲</span><div><span className="zone-kicker">THINK & WIN</span><h3>Board games</h3><p>Ludo, chess and quick classics.</p></div><span className="zone-arrow"><ArrowRight size={17} /></span></button>
                  <button className="zone-card zone-friends" onClick={() => { setActiveCategory('friends'); setActiveNav('Games'); }}><span className="zone-icon">🎉</span><div><span className="zone-kicker">LET LOOSE</span><h3>Friends & party</h3><p>Truth, dares, votes and laughs.</p></div><span className="zone-arrow"><ArrowRight size={17} /></span></button>
                  <button className="zone-card zone-couples" onClick={() => { setActiveCategory('couples'); setActiveNav('Games'); }}><span className="zone-icon">💗</span><div><span className="zone-kicker">JUST YOU TWO</span><h3>Couples corner</h3><p>Sweet questions and date-night fun.</p></div><span className="zone-arrow"><ArrowRight size={17} /></span></button>
                  <button className="zone-card zone-adults" onClick={() => { setAdultSectionUnlocked(false); setActiveNav('Adults'); setMobileMenuOpen(false); }}><span className="zone-icon">🌙</span><div><span className="zone-kicker">18+ · ADULTS ONLY</span><h3>After Dark</h3><p>Bold adult games and couples challenges.</p></div><span className="zone-arrow"><ArrowRight size={17} /></span></button>
                </div>
              </section>

              <section className="section-block">
                <div className="section-heading compact-heading"><div><p className="eyebrow">THE CROWD FAVOURITES</p><h2>Ready when you are</h2></div><button className="text-button" onClick={() => goTo('Games')}>See all <ArrowRight size={16} /></button></div>
                <div className="game-grid home-game-grid">
                  {games.filter((game) => ['truth-dare-friends', 'tic-tac-toe', 'couple-truth-dare', 'ludo'].includes(game.id)).map((game) => <GameCard key={game.id} game={game} onSelect={selectGame} />)}
                </div>
              </section>

              <section className="room-banner">
                <div className="room-banner-art"><div className="room-banner-bubble bubble-a">Y</div><div className="room-banner-bubble bubble-b">♥</div><div className="room-banner-bubble bubble-c">✦</div><Users size={38} /></div>
                <div className="room-banner-copy"><p className="eyebrow">BRING YOUR PEOPLE</p><h2>Your room. Your rules.</h2><p>Create a room, share its code, and watch your lobby update as friends join.</p></div>
                <button className="button button-light" onClick={() => openCreate()}>Create a room <Plus size={17} /></button>
              </section>
            </>
          )}

          {activeNav === 'Games' && (
            <section className="catalog-page">
              <p className="eyebrow"><Gamepad2 size={14} /> THE GAME SHELF</p>
              <div className="catalog-title-row"><div><h1>Find your <span>next favourite.</span></h1><p className="welcome-copy">Pick the mood. We’ll handle the fun.</p></div><button className="button button-primary" onClick={() => openCreate()}><Plus size={17} /> Create a room</button></div>
              <div className="catalog-tools"><label className="search-box"><Search size={18} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search games, moods, categories…" aria-label="Search games" />{search && <button aria-label="Clear search" onClick={() => setSearch('')}><X size={15} /></button>}</label><div className="filter-label"><Settings2 size={16} /> FILTER BY</div></div>
              <div className="filter-tabs" role="group" aria-label="Filter games by category">{categoryOrder.map((category) => <button key={category} className={activeCategory === category ? 'filter-tab active' : 'filter-tab'} onClick={() => setActiveCategory(category)}>{categoryLabels[category]}<span>{filterGames(games, category, '').length}</span></button>)}</div>
              <div className="catalog-results-heading"><strong>{activeCategory === 'all' ? 'All games' : categoryLabels[activeCategory]}</strong><span>{visibleGames.length} games listed · {mvpCount} playable in V1</span></div>
              {visibleGames.length > 0 ? <div className="game-grid catalog-game-grid">{visibleGames.map((game) => <GameCard key={game.id} game={game} onSelect={selectGame} />)}</div> : <div className="empty-state"><span>🔎</span><h3>No games found</h3><p>Try another search or switch category.</p><button className="button button-secondary" onClick={() => { setSearch(''); setActiveCategory('all'); }}>Clear filters</button></div>}
            </section>
          )}

          {activeNav === 'Adults' && (
            <section className="adults-page">
              <section className="adult-hero">
                <div className="adult-hero-glow" />
                <p className="adult-eyebrow"><Flame size={15} /> PRIVATE ZONE · ADULTS 18+</p>
                <h1>After hours.<br /><span>Your rules.</span></h1>
                <p className="adult-hero-copy">A separate shelf for grown-up party games, bolder conversations and couples challenges. Choose your vibe, keep your boundaries, and pass any prompt without explaining.</p>
                <div className="adult-hero-pills"><span>18+ only</span><span>Consent first</span><span>Skip anytime</span></div>
              </section>

              {!adultSectionUnlocked ? (
                <section className="adult-age-gate" aria-labelledby="adult-gate-title">
                  <div className="adult-lock-mark"><ShieldCheck size={26} /></div>
                  <div className="adult-gate-copy"><p className="eyebrow">AGE CONFIRMATION</p><h2 id="adult-gate-title">Adults only (18+)</h2><p>By entering, you confirm you are 18 or older. Adult packs are optional; every player can skip a prompt or choose a lighter pack.</p></div>
                  <button className="button adult-enter-button" onClick={() => setAdultSectionUnlocked(true)}>I’m 18+ — enter <ArrowRight size={16} /></button>
                </section>
              ) : (
                <>
                  <section className="adult-games-section">
                    <div className="adult-section-heading"><div><p className="eyebrow">READY TO PLAY</p><h2>Adult games</h2><p>Choose a game that everyone in the room is comfortable with.</p></div><span className="adult-section-count">{adultHubGames.filter((game) => game.status === 'playable').length} playable</span></div>
                    <div className="adult-game-grid">
                      {adultHubGames.filter((game) => game.status === 'playable').map((game: AdultHubGame) => (
                        <article className="adult-game-card adult-game-playable" key={game.id}>
                          <div className="adult-game-art"><span>{game.emoji}</span><b>18+</b></div>
                          <div className="adult-game-body"><div className="adult-game-tag">PLAY NOW</div><h3>{game.title}</h3><p>{game.description}</p><div className="adult-game-meta"><span>{game.players}</span><span>{game.duration}</span></div><button className="button adult-card-button" onClick={() => { const target = games.find((item) => item.id === game.linkedGameId); if (!target) { setNotice('This game is not available yet.'); return; } setCreateGameId(target.id); setDarePack('classic'); setAdultConfirmed(false); setDareError(''); setModal('create'); setNotice('After the room opens, choose Spicy 18+ or After Dark and confirm the adult-pack checkbox to start those prompts.'); }}>Play game <ArrowRight size={16} /></button></div>
                        </article>
                      ))}
                    </div>
                  </section>

                  <section className="adult-games-section adult-coming-section">
                    <div className="adult-section-heading"><div><p className="eyebrow">IN THE WORKS</p><h2>Coming soon</h2><p>Highlighted ideas for the next adult-game releases. These cards are previews, not playable yet.</p></div><span className="adult-coming-label"><Sparkles size={13} /> COMING SOON</span></div>
                    <div className="adult-game-grid adult-coming-grid">
                      {adultHubGames.filter((game) => game.status === 'coming-soon').map((game: AdultHubGame) => (
                        <article className="adult-game-card adult-game-coming" key={game.id}>
                          <div className="adult-game-art"><span>{game.emoji}</span><b>18+</b></div>
                          <div className="adult-game-body"><div className="adult-game-tag coming">COMING SOON</div><h3>{game.title}</h3><p>{game.description}</p><button className="adult-coming-button" disabled aria-label={`${game.title}, coming soon`}>Not playable yet <LockKeyhole size={14} /></button></div>
                        </article>
                      ))}
                    </div>
                  </section>
                  <div className="adult-house-rules"><ShieldCheck size={18} /><p><strong>Keep it fun, never pressured.</strong> Every adult prompt is optional. Ask first before touch-based dares, respect a “no” immediately, and never share private photos or personal details as a challenge.</p></div>
                </>
              )}
            </section>
          )}

          {activeNav === 'Rooms' && (
            <section className="rooms-page">
              <p className="eyebrow"><Users size={14} /> YOUR GAME ROOMS</p>
              <div className="catalog-title-row"><div><h1>Rooms for your <span>people.</span></h1><p className="welcome-copy">{isSupabaseConfigured ? 'Invite friends with a code and watch the lobby update live.' : 'Preview the room flow now; connect Supabase to let friends join from their own phones.'}</p></div><button className="button button-primary" onClick={() => openCreate()}><Plus size={17} /> Create room</button></div>
              <div className={`prototype-notice ${isSupabaseConfigured && backendStatus === 'online' ? 'online-notice' : ''}`}><ShieldCheck size={19} /><div><strong>{isSupabaseConfigured && backendStatus === 'online' ? 'Realtime rooms connected' : backendStatus === 'error' ? 'Backend setup needs attention' : 'Demo preview mode'}</strong><p>{isSupabaseConfigured && backendStatus === 'online' ? 'Room membership is stored in Supabase. Tic Tac Toe, Truth or Dare, and Ludo can sync online after the V1.1 migration is applied. Other party rounds are local/pass-the-phone in this release.' : backendStatus === 'error' ? 'Check the displayed error, environment variables, Supabase anonymous sign-in setting and SQL schema. Do not use a service-role key in the frontend.' : 'Rooms stay in this browser only until you configure Supabase. The ZIP includes the SQL schema and GitHub Pages workflow.'}</p></div></div>
              <div className="room-actions-row"><button className="room-action-card" onClick={() => openCreate()}><span className="action-card-icon purple-icon"><Plus size={22} /></span><div><strong>Create a room</strong><p>{isSupabaseConfigured ? 'Create a shared online lobby.' : 'Create a local demo room.'}</p></div><ChevronRight size={18} /></button><button className="room-action-card" onClick={() => { setModal('join'); setNotice(''); }}><span className="action-card-icon peach-icon"><Users size={22} /></span><div><strong>Join with a code</strong><p>Join a friend’s online lobby by code.</p></div><ChevronRight size={18} /></button></div>

              {onlineRoomState && (
                <section className="online-room-panel" aria-label="Current online room">
                  <div className="online-room-top"><div><p className="eyebrow">LIVE LOBBY</p><h2>{onlineRoomState.room.room_name}</h2><p>{games.find((game) => game.id === onlineRoomState.room.game_id)?.name ?? onlineRoomState.room.game_id} · {onlineRoomState.room.status !== 'open' || new Date(onlineRoomState.room.expires_at).getTime() <= Date.now() ? 'Closed / expired room' : 'Open room'}</p></div><span className={`online-live-badge ${onlineRoomState.room.status !== 'open' || new Date(onlineRoomState.room.expires_at).getTime() <= Date.now() ? 'closed' : ''}`}><i /> {onlineRoomState.room.status !== 'open' || new Date(onlineRoomState.room.expires_at).getTime() <= Date.now() ? 'CLOSED' : 'LIVE'}</span></div>
                  <div className="online-code-row"><span>ROOM CODE</span><strong>{onlineRoomState.room.code}</strong><button className="button button-secondary" onClick={() => void copyText(`${window.location.origin}${window.location.pathname}?room=${onlineRoomState.room.code}`, 'Invite link copied. Send it to your friend.') }><Copy size={15} /> Copy invite link</button></div>
                  <div className="online-members-heading"><strong>Players</strong><span>{onlineRoomState.players.length}/{onlineRoomState.room.max_players}</span></div>
                  <div className="online-members">{onlineRoomState.players.map((player) => <div className="online-member" key={player.id}><span className="online-member-avatar">{player.display_name.slice(0, 1).toUpperCase()}</span><span>{player.display_name}{player.user_id === onlineRoomState.room.host_user_id && <small>HOST</small>}</span>{player.user_id === onlineRoomState.room.host_user_id && <ShieldCheck size={16} />}</div>)}</div>
                  <RoomChat roomId={onlineRoomState.room.id} myUserId={myUserId} />
                  <div className="online-room-foot"><span>Lobby sync is live. Tic Tac Toe and Truth or Dare share validated game state when the V1 Supabase schema is installed.</span><button className="button button-secondary" disabled={working} onClick={() => void handleLeaveRoom()}>Leave room</button></div>
                </section>
              )}

              {currentRoom?.gameId === 'tic-tac-toe' && (
                <section className="ttt-panel" aria-label="Tic Tac Toe game">
                  <div className="ttt-panel-heading">
                    <div><p className="eyebrow">NOW PLAYING</p><h2>Tic Tac Toe <span>❎</span></h2><p>{hasOnlineTtt ? 'Moves are validated by the room backend and synced live.' : 'Local demo: take turns on this device. Open a configured online room to play across phones.'}</p></div>
                    <span className={`ttt-mode-badge ${hasOnlineTtt ? 'ttt-live' : ''}`}>{hasOnlineTtt ? 'ONLINE GAME' : 'LOCAL / AI'}</span>
                  </div>
                  {!hasOnlineTtt && <div className="ttt-ai-controls"><div className="ttt-ai-switch" role="group" aria-label="Tic Tac Toe opponent"><button className={tttOpponent === 'computer' ? 'active' : ''} onClick={() => { setTttOpponent('computer'); setTttDemoBoard(emptyBoard()); setTttDemoTurn('X'); setTttDemoStatus('playing'); }}>Vs Computer</button><button className={tttOpponent === 'friend' ? 'active' : ''} onClick={() => { setTttOpponent('friend'); setTttDemoBoard(emptyBoard()); setTttDemoTurn('X'); setTttDemoStatus('playing'); }}>Same Phone</button></div>{tttOpponent === 'computer' && <label className="ttt-ai-level">Difficulty <select value={tttDifficulty} onChange={(event) => { setTttDifficulty(event.target.value as AiDifficulty); setTttDemoBoard(emptyBoard()); setTttDemoTurn('X'); setTttDemoStatus('playing'); }}><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard (unbeatable)</option></select></label>}</div>}
                  <div className="ttt-status" role="status"><span className="ttt-status-dot" />{tttStatusMessage}</div>
                  <div className="ttt-game-layout">
                    <div className="ttt-board" role="group" aria-label="Tic Tac Toe board">
                      {shownTttBoard.map((cell, index) => (
                        <button
                          key={index}
                          className={`ttt-cell ${cell ? `ttt-${cell.toLowerCase()}` : ''} ${shownTttWinningLine?.includes(index) ? 'ttt-winning-cell' : ''}`}
                          aria-label={`Cell ${index + 1}${cell ? `, ${cell}` : ', empty'}`}
                          disabled={!tttCanMove || cell !== null || shownTttStatus !== 'playing'}
                          onClick={() => void handleTttMove(index)}
                        >{cell ?? ''}</button>
                      ))}
                    </div>
                    <div className="ttt-side-info">
                      <div className="ttt-player-card"><span className="ttt-player-mark mark-x">X</span><div><strong>{hasOnlineTtt ? tttXPlayerName : 'Player X'}</strong><small>{hasOnlineTtt && shownTttState?.x_user_id === myUserId ? 'YOU' : 'FIRST MOVE'}</small></div></div>
                      <div className="ttt-player-card"><span className="ttt-player-mark mark-o">O</span><div><strong>{hasOnlineTtt ? tttOPlayerName : tttOpponent === 'computer' ? 'Computer' : 'Player O'}</strong><small>{hasOnlineTtt && shownTttState?.o_user_id === myUserId ? 'YOU' : !hasOnlineTtt && tttOpponent === 'computer' ? 'AI OPPONENT' : 'SECOND MOVE'}</small></div></div>
                      {shownTttStatus === 'x_won' || shownTttStatus === 'o_won' || shownTttStatus === 'draw' ? (
                        <button className="button button-primary ttt-rematch-button" disabled={tttWorking || (hasOnlineTtt && Boolean(shownTttState && (myTttMark === 'X' ? shownTttState.x_rematch_ready : shownTttState.o_rematch_ready)))} onClick={() => void handleTttRematch()}><RefreshCw size={16} /> {hasOnlineTtt && shownTttState && (myTttMark === 'X' ? shownTttState.x_rematch_ready : shownTttState.o_rematch_ready) ? 'Rematch requested' : 'Play again'}</button>
                      ) : (
                        <div className="ttt-tip"><Trophy size={16} /><span>Get three in a row to win.</span></div>
                      )}
                    </div>
                  </div>
                  {hasOnlineTtt && shownTttState?.status !== 'waiting' && (shownTttState?.x_rematch_ready || shownTttState?.o_rematch_ready) && <p className="ttt-rematch-note">Rematch requested. Both players must agree to start the next round.</p>}
                  {tttError && <p className="ttt-error" role="alert">{tttError}</p>}
                  {!hasOnlineTtt && <p className="ttt-demo-warning">Demo mode is not shared with other devices. Configure Supabase and create an online Tic Tac Toe room for real multiplayer.</p>}
                </section>
              )}

              {isDareGame && currentRoom && (
                <section className={`dare-panel ${dareMode === 'couples' ? 'dare-couples' : ''}`} aria-label="Truth or Dare game">
                  <div className="dare-panel-heading">
                    <div><p className="eyebrow">NOW PLAYING · {dareMode === 'couples' ? 'COUPLES CORNER' : 'FRIENDS & PARTY'}</p><h2>{dareMode === 'couples' ? 'Couple Truth or Dare 💗' : 'Truth or Dare 🎭'}</h2><p>Take turns, pick a prompt and keep the fun comfortable for everyone.</p></div>
                    <span className={`dare-mode-badge ${hasOnlineDare ? 'ttt-live' : ''}`}>{hasOnlineDare ? 'SHARED ONLINE ROUND' : 'LOCAL DEMO ROUND'}</span>
                  </div>
                  <div className="dare-pack-controls">
                    <label className="field-label" htmlFor="dare-pack">Prompt vibe</label>
                    <select id="dare-pack" className="form-input" value={darePack} onChange={(event) => { const pack = event.target.value as PromptPack; if ((pack === 'spicy' || pack === 'after-dark') && !adultConfirmed) { setDareError('Confirm you are 18+ to unlock adult packs.'); return; } if (['romantic', 'flirty', 'after-dark'].includes(pack) && dareMode !== 'couples') { setDareError('Romantic and After Dark packs are for Couples mode.'); return; } setDarePack(pack); setDareError(''); }}>
                      {(Object.keys(promptPackLabels) as PromptPack[]).filter((pack) => dareMode === 'couples' || !['romantic', 'flirty', 'after-dark'].includes(pack)).map((pack) => <option key={pack} value={pack} disabled={((pack === 'spicy' || pack === 'after-dark') && !adultConfirmed)}>{promptPackLabels[pack]}</option>)}
                    </select>
                    <label className="adult-confirm-row"><input type="checkbox" checked={adultConfirmed} onChange={(event) => { setAdultConfirmed(event.target.checked); if (!event.target.checked && ['spicy', 'after-dark'].includes(darePack)) setDarePack('classic'); }} /><span>I’m 18+ and comfortable with adult/flirty prompts.</span></label>
                    <p className="pack-guidance">After Dark is couples-only. Everyone can skip any prompt; never pressure another player.</p>
                  </div>
                  <div className="dare-stats"><div><strong>{displayedDareCompleted}</strong><span>Completed</span></div><div><strong>{displayedDareSkipped}</strong><span>Skipped</span></div><div><strong>{displayedDareTurn + 1}</strong><span>Current seat</span></div></div>
                  <div className="dare-current-player"><span className="dare-avatar">{displayedDareCurrentPlayer.slice(0, 1).toUpperCase()}</span><div><small>{hasOnlineDare && displayedDareCurrentPlayer !== 'Connecting…' && isMyDareTurn ? 'YOUR TURN' : 'CURRENT TURN'}</small><strong>{displayedDareCurrentPlayer}</strong></div></div>
                  {dareError && <p className="ttt-error" role="alert">{dareError}</p>}
                  {hasOnlineDare && !dareOnlineState ? (
                    <div className="dare-choice"><p>Connecting to the shared round…</p><span className="muted-copy">If this keeps showing, confirm the YaarJam V1 SQL schema ran successfully.</span></div>
                  ) : hasOnlineDare && (dareOnlineState?.player_order.length ?? 0) < 2 ? (
                    <div className="dare-choice"><p>Waiting for a friend to join</p><span className="muted-copy">Share room code <strong>{currentRoom.code}</strong>. Once two players are in the room, the first turn becomes available.</span></div>
                  ) : !displayedDarePrompt ? (
                    <div className="dare-choice"><p>{hasOnlineDare && !isMyDareTurn ? `Waiting for ${displayedDareCurrentPlayer} to choose…` : 'Choose your challenge'}</p><div><button className="button button-primary" disabled={!canChooseDare} onClick={() => void pickDarePrompt('truth')}>💬 Truth</button><button className="button button-secondary dare-button" disabled={!canChooseDare} onClick={() => void pickDarePrompt('dare')}>⚡ Dare</button></div></div>
                  ) : (
                    <div className="dare-prompt-card"><span className={`dare-prompt-kind ${displayedDarePrompt.kind}`}>{displayedDarePrompt.kind === 'truth' ? '💬 TRUTH' : '⚡ DARE'}</span><p>{displayedDarePrompt.text}</p><div className="dare-prompt-actions"><button className="button button-secondary" disabled={!canResolveDare} onClick={() => void finishDareTurn(true)}>Skip prompt</button><button className="button button-primary" disabled={!canResolveDare} onClick={() => void finishDareTurn(false)}><Check size={16} /> Done · Next turn</button></div>{hasOnlineDare && !isMyDareTurn && <p className="muted-copy">Only the current player can resolve this prompt.</p>}</div>
                  )}
                  <p className="dare-safety-note"><ShieldCheck size={15} /> Anyone can skip without explaining. No pressure, no punishments. Adult packs are flirty/suggestive, not explicit. {hasOnlineDare ? 'The current prompt, turns and counters are stored in Supabase and sync to room members. Run the V1.1 migration to enable prompt packs.' : 'Demo rounds run only on this device; configure Supabase for cross-device rooms.'}</p>
                </section>
              )}

              {currentRoom?.gameId === 'ludo' && <LudoPanel playerName={playerName} roomId={currentRoom.mode === 'online' ? onlineRoomState?.room.id : undefined} myUserId={myUserId} roomPlayers={onlineRoomState?.players ?? []} hostUserId={onlineRoomState?.room.host_user_id ?? null} />}
              {currentRoom?.mode === 'demo' && ['would-you-rather', 'this-or-that', 'never-have-i-ever', 'most-likely-to', 'guess-word', 'partner-quiz', 'our-story', 'rock-paper-scissors'].includes(currentRoom.gameId) && <LocalPartyGamePanel gameId={currentRoom.gameId} playerName={playerName} />}

              <div className="section-heading room-list-heading"><div><p className="eyebrow">ROOM HISTORY</p><h2>Recent rooms</h2></div><span className="room-local-label">THIS BROWSER</span></div>
              {rooms.length ? <div className="room-list">{rooms.map((room) => <div className="room-list-item" key={`${room.mode}-${room.id ?? room.code}`}><div className="room-list-icon">{games.find((game) => game.id === room.gameId)?.emoji ?? '🎮'}</div><div className="room-list-main"><strong>{room.roomName} · {room.gameName}</strong><span>{room.mode === 'online' ? 'ONLINE' : 'DEMO'} · Code: <b>{room.code}</b> · {room.createdAt}</span></div><button className="icon-button room-copy-button" aria-label={`Copy room code ${room.code}`} onClick={() => void copyText(room.code, 'Room code copied.') }><Copy size={17} /></button></div>)}</div> : <div className="empty-state room-empty"><span>🛋️</span><h3>No rooms yet</h3><p>Make a room or join a friend’s room to see it here.</p><button className="button button-primary" onClick={() => openCreate()}>Make your first room <ArrowRight size={16} /></button></div>}
            </section>
          )}

          {activeNav === 'Profile' && (
            <section className="profile-page">
              <p className="eyebrow"><Heart size={14} /> YOUR PLAYER SPACE</p>
              <h1>Hey there, <span>{playerName || 'guest'}.</span></h1><p className="welcome-copy">Your guest name is saved on this device. No email or password is required for guest rooms.</p>
              <div className="profile-preview-card"><div className="profile-preview-top"><div className="avatar avatar-large">Y</div><div><h2>{playerName || 'Guest player'}</h2><p>{backendStatus === 'online' ? 'Guest session connected' : 'Local preview guest'}</p></div><span className="guest-badge">GUEST</span></div><div className="profile-preview-grid"><div><span>Games in catalogue</span><strong>{games.length}</strong></div><div><span>Rooms seen here</span><strong>{rooms.length}</strong></div><div><span>Saved achievements</span><strong>—</strong></div></div><div className="prototype-notice"><CircleHelp size={19} /><div><strong>What works right now?</strong><p>Guest name and catalogue work. Tic Tac Toe and Truth or Dare support local demo play and secure online play when the matching Supabase migrations are installed; other game rounds are still planned.</p></div></div></div>
            </section>
          )}

          <footer className="site-footer"><span>© 2026 YaarJam</span><span><i /> V1.2.0 · {isSupabaseConfigured && backendStatus === 'online' ? 'Realtime rooms + Tic Tac Toe + Truth or Dare + Ludo' : 'Demo / setup required'}</span><button onClick={() => setNotice(isSupabaseConfigured ? 'Rooms and Tic Tac Toe use Supabase. Test a Tic Tac Toe room from two separate devices.' : 'To use cross-device rooms, run supabase/schema.sql (or the appropriate existing-database migration) and configure VITE_SUPABASE_URL plus VITE_SUPABASE_ANON_KEY.')}>About this build <ChevronDown size={13} /></button></footer>
        </div>
      </main>

      <nav className="mobile-bottom-nav" aria-label="Mobile navigation">{navigation.map(({ label, icon: Icon }) => <button key={label} aria-label={label === 'Adults' ? 'Adults 18+ section' : label} className={activeNav === label ? 'mobile-nav-item active' : 'mobile-nav-item'} onClick={() => goTo(label)}><Icon size={19} /><span>{label === 'Adults' ? '18+' : label}</span></button>)}</nav>

      {notice && <div className="toast" role="status"><ClipboardCheck size={17} /><span>{notice}</span><button onClick={() => setNotice('')} aria-label="Dismiss message"><X size={15} /></button></div>}

      {modal && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) { setModal(null); setNotice(''); } }}>
        <section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="modal-title">
          <button className="modal-close icon-button" aria-label="Close dialog" onClick={() => { setModal(null); setNotice(''); }}><X size={19} /></button>
          {modal === 'create' && <>
            <div className="modal-icon purple-icon"><Plus size={24} /></div><p className="eyebrow">MAKE IT A MOMENT</p><h2 id="modal-title">Create your room</h2><p className="modal-subtitle">Choose a game and give this hangout a name.</p>
            <label className="field-label" htmlFor="player-name">Your name (shown to friends)</label><input id="player-name" className="form-input" maxLength={18} value={playerName} onChange={(event) => rememberPlayerName(event.target.value)} placeholder="e.g. Vashu" />
            <label className="field-label" htmlFor="room-name">Room name</label><input id="room-name" className="form-input" maxLength={36} value={roomName} onChange={(event) => setRoomName(event.target.value)} placeholder="e.g. Friday night gang" />
            <label className="field-label" htmlFor="create-game">Choose a game</label><select id="create-game" className="form-input" value={createGameId} onChange={(event) => setCreateGameId(event.target.value)}>{games.map((game) => <option key={game.id} value={game.id} disabled={!isPlayableGame(game.id)}>{game.emoji} {game.name}{!isPlayableGame(game.id) ? ' · planned' : ''}</option>)}</select>
            <div className="modal-demo-note"><ShieldCheck size={17} /><span>{isOnlineGame(createGameId) && isSupabaseConfigured ? (createGameId === 'tic-tac-toe' ? 'Room and game state will be saved to Supabase. Choose online play or the computer from inside a local Tic Tac Toe room.' : 'Room membership is online. Apply the V1.1 Supabase SQL migration to enable room chat, online Ludo, and shared prompt packs.') : 'This game is local/pass-the-phone or versus computer in V1.1. Online syncing is only enabled for Tic Tac Toe and Truth or Dare until the next game-state migration.'}</span></div>
            <button className="button button-primary modal-main-button" disabled={working} onClick={() => void handleCreateRoom()}>{working ? 'Creating room…' : isSupabaseConfigured && isOnlineGame(createGameId) ? 'Create online room' : 'Start local game'} <ArrowRight size={17} /></button>
          </>}
          {modal === 'created' && currentRoom && <>
            <div className="modal-success-icon"><Check size={24} /></div><p className="eyebrow">{currentRoom.mode === 'online' ? 'ONLINE ROOM CREATED' : 'DEMO ROOM CREATED'}</p><h2 id="modal-title">{currentRoom.mode === 'online' ? 'Your online lobby is ready.' : 'Your demo room is ready.'}</h2><p className="modal-subtitle">{currentRoom.roomName} · {currentRoom.gameName}</p>
            <div className="room-code-display"><span>{currentRoom.mode === 'online' ? 'SHARE THIS ROOM CODE' : 'DEMO ROOM CODE'}</span><strong>{currentRoom.code}</strong><button className="button button-secondary" onClick={() => void copyText(currentRoom.code, 'Room code copied.')}><Copy size={16} /> Copy code</button></div>
            <div className={`modal-demo-note ${currentRoom.mode === 'online' ? '' : 'warning-note'}`}><CircleHelp size={18} /><span>{currentRoom.mode === 'online' ? 'Send the invite link or code to friends. The player list and room chat update live; online Truth or Dare and Tic Tac Toe require the V1 schema.' : 'This game is local/pass-the-phone or versus computer on this device. Create a room for Tic Tac Toe or Truth or Dare for supported cross-device play.'}</span></div>
            <button className="button button-primary modal-main-button" onClick={() => { setModal(null); setActiveNav('Rooms'); setNotice(currentRoom.mode === 'online' ? 'Online room ready. Share the invite code with your friend.' : 'Demo room saved in this browser session only.'); }}>Go to my rooms <ArrowRight size={17} /></button>
            <button className="link-button modal-secondary-button" onClick={() => void copyText(inviteLink, currentRoom.mode === 'online' ? 'Invite link copied. Send it to your friend.' : 'Preview link copied, but it will only open the demo page.')}>Copy {currentRoom.mode === 'online' ? 'invite link' : 'preview link'}</button>
          </>}
          {modal === 'join' && <>
            <div className="modal-icon peach-icon"><Users size={24} /></div><p className="eyebrow">YOUR FRIENDS ARE WAITING</p><h2 id="modal-title">Join a room</h2><p className="modal-subtitle">Enter the invite code your friend shared with you.</p>
            <label className="field-label" htmlFor="join-player-name">Your name</label><input id="join-player-name" className="form-input" maxLength={18} value={playerName} onChange={(event) => rememberPlayerName(event.target.value)} placeholder="e.g. Vashu" />
            <label className="field-label" htmlFor="join-code">Room code</label><input id="join-code" className="form-input code-input" maxLength={8} value={joinCode} onChange={(event) => { setJoinCode(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '')); setNotice(''); }} placeholder="E.g. K7M4PA" autoCapitalize="characters" />
            <p className="field-hint">6–8 letters or numbers. Codes ignore letter case.</p>
            <div className="modal-demo-note"><ShieldCheck size={17} /><span>{isSupabaseConfigured ? 'This looks up the room on Supabase and joins you if it is open and not full.' : 'Demo mode can only recognize rooms created in this same browser. Configure Supabase for real invites.'}</span></div>
            <button className="button button-primary modal-main-button" disabled={working} onClick={() => void handleJoinRoom()}>{working ? 'Joining room…' : isSupabaseConfigured ? 'Join online room' : 'Check / join demo room'} <ArrowRight size={17} /></button>
          </>}
          {modal === 'game' && <>
            <div className={`game-detail-art art-${selectedGame.theme}`}><span>{selectedGame.emoji}</span><div className="art-spark">✦</div></div><p className="eyebrow">{categoryLabels[selectedGame.category].toUpperCase()}</p><h2 id="modal-title">{selectedGame.name}</h2><p className="modal-subtitle">{selectedGame.shortDescription}</p>
            <div className="game-detail-meta"><div><Users size={17} /><span>{selectedGame.players}</span></div><div><Zap size={17} /><span>{selectedGame.duration}</span></div></div>
            <div className="game-status-note"><span className={`status-dot ${selectedGame.status}`} />{isOnlineGame(selectedGame.id) ? 'Online room supported; Tic Tac Toe has local AI too' : isPlayableGame(selectedGame.id) ? 'Playable in local / pass-the-phone mode; cross-device game sync is planned' : 'Planned for a later release'}{!isPlayableGame(selectedGame.id) && <span className="status-demo">Not playable yet</span>}</div>
            <button className="button button-primary modal-main-button" disabled={!isPlayableGame(selectedGame.id)} onClick={() => openCreate(selectedGame)}>{isPlayableGame(selectedGame.id) ? 'Create a room for this game' : 'Coming in a future update'} <ArrowRight size={17} /></button>
            {selectedGame.id === 'tic-tac-toe' && <button className="button button-secondary modal-main-button" onClick={() => { const room: DemoRoom = { mode: 'demo', code: makeDemoRoomCode(), gameId: 'tic-tac-toe', gameName: 'Tic Tac Toe vs Computer', roomName: 'Computer challenge', createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), maxPlayers: 2, status: 'open' }; setCurrentRoom(room); setOnlineRoomState(null); setTttOpponent('computer'); setTttDemoBoard(emptyBoard()); setTttDemoTurn('X'); setTttDemoStatus('playing'); setModal(null); setActiveNav('Rooms'); setNotice('Computer match ready. Choose Easy, Medium or Hard on the game panel.'); }}>Play vs Computer <Zap size={16} /></button>}
            {selectedGame.id === 'ludo' && <button className="button button-secondary modal-main-button" onClick={() => { const room: DemoRoom = { mode: 'demo', code: makeDemoRoomCode(), gameId: 'ludo', gameName: 'Ludo vs Computer', roomName: 'Computer challenge', createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), maxPlayers: 2, status: 'open' }; setCurrentRoom(room); setOnlineRoomState(null); setModal(null); setActiveNav('Rooms'); setNotice('Ludo computer match ready. Choose Vs Computer or Same Phone in the game panel.'); }}>Play vs Computer / Same Phone <Zap size={16} /></button>}
          </>}
        </section>
      </div>}
    </div>
  );
}

function GameCard({ game, onSelect }: { game: GameDefinition; onSelect: (game: GameDefinition) => void }) {
  return (
    <button className="game-card" onClick={() => onSelect(game)}>
      <div className={`game-card-art art-${game.theme}`}><span className="game-card-emoji">{game.emoji}</span><span className={`status-chip ${game.status}`}>{isPlayableGame(game.id) ? 'PLAYABLE' : 'PLANNED'}</span><span className="game-art-spark">✦</span></div>
      <div className="game-card-content"><div className="game-card-title-row"><h3>{game.name}</h3><span className="card-arrow"><ArrowRight size={16} /></span></div><p>{game.shortDescription}</p><div className="game-card-meta"><span><Users size={14} />{game.players}</span><span><Zap size={14} />{game.duration}</span></div></div>
    </button>
  );
}

export default App;
