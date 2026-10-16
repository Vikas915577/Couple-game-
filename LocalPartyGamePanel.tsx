import { useMemo, useState } from 'react';
import { ArrowRight, RefreshCw, ShieldCheck, Sparkles } from 'lucide-react';
import { getPartyPrompts, type PartyPrompt } from '../lib/party-prompts';

const gameTitles: Record<string, string> = {
  'would-you-rather': 'Would You Rather', 'this-or-that': 'This or That', 'never-have-i-ever': 'Never Have I Ever',
  'most-likely-to': 'Most Likely To', 'guess-word': 'Guess the Word', 'partner-quiz': 'How Well Do You Know Me?', 'our-story': 'Our Story Quiz',
};

export function LocalPartyGamePanel({ gameId, playerName }: { gameId: string; playerName: string }) {
  const prompts = useMemo(() => getPartyPrompts(gameId), [gameId]);
  const [promptIndex, setPromptIndex] = useState(0);
  const [shown, setShown] = useState(false);
  const [playersRaw, setPlayersRaw] = useState(`${playerName || 'You'}, Friend 1, Friend 2`);
  const [currentVoter, setCurrentVoter] = useState(0);
  const [votes, setVotes] = useState<Record<string, string>>({});
  const [tally, setTally] = useState<Record<string, number>>({ left: 0, right: 0, have: 0, never: 0 });
  const [rpsChoice, setRpsChoice] = useState<string | null>(null);
  const [rpsComputer, setRpsComputer] = useState<string | null>(null);
  const prompt: PartyPrompt | undefined = prompts[promptIndex % Math.max(prompts.length, 1)];
  const players = playersRaw.split(',').map((name) => name.trim()).filter(Boolean).slice(0, 10);
  const safePlayers = players.length ? players : ['You', 'Friend 1'];

  function nextPrompt() {
    setPromptIndex((index) => index + 1); setShown(false); setCurrentVoter(0); setVotes({}); setTally({ left: 0, right: 0, have: 0, never: 0 });
  }
  function recordVote(key: string) {
    setVotes((current) => ({ ...current, [safePlayers[currentVoter]]: key }));
    if (key === 'left') setTally((t) => ({ ...t, left: t.left + 1 }));
    if (key === 'right') setTally((t) => ({ ...t, right: t.right + 1 }));
    if (key === 'have') setTally((t) => ({ ...t, have: t.have + 1 }));
    if (key === 'never') setTally((t) => ({ ...t, never: t.never + 1 }));
    if (currentVoter < safePlayers.length - 1) setCurrentVoter((v) => v + 1);
    else setShown(true);
  }
  function playRps(choice: string) {
    const options = ['Rock', 'Paper', 'Scissors'];
    setRpsChoice(choice);
    setRpsComputer(options[Math.floor(Math.random() * options.length)]);
  }
  function voteForPlayer(name: string) {
    setVotes((current) => ({ ...current, [safePlayers[currentVoter]]: name }));
    setTally((current) => ({ ...current, [name]: (current[name] ?? 0) + 1 }));
    if (currentVoter < safePlayers.length - 1) setCurrentVoter((v) => v + 1); else setShown(true);
  }

  return <section className="local-party-panel" aria-label={`${gameTitles[gameId] ?? 'Party game'} local game`}>
    <div className="local-party-heading"><div><p className="eyebrow"><Sparkles size={13} /> QUICK PLAY · PASS THE PHONE</p><h2>{gameTitles[gameId] ?? 'Party Game'}</h2><p>This mode runs on this device for now. Everyone takes turns on the same phone.</p></div><span className="local-mode-pill">LOCAL PLAY</span></div>
    <label className="field-label" htmlFor="party-player-names">Player names (comma-separated)</label>
    <input className="form-input" id="party-player-names" value={playersRaw} onChange={(event) => setPlayersRaw(event.target.value)} maxLength={160} placeholder="You, Friend 1, Friend 2" />
    {gameId === 'rock-paper-scissors' ? <div className="local-party-card"><span className="local-party-count">QUICK COMPUTER MATCH</span><h3>Rock, Paper, Scissors</h3><div className="party-choice-grid">{['Rock', 'Paper', 'Scissors'].map((choice) => <button key={choice} className="party-choice" onClick={() => playRps(choice)}>{choice}</button>)}</div>{rpsChoice && rpsComputer && <div className="party-results"><strong>You: {rpsChoice} · Computer: {rpsComputer}</strong><span>{rpsChoice === rpsComputer ? 'It’s a draw!' : (rpsChoice === 'Rock' && rpsComputer === 'Scissors') || (rpsChoice === 'Paper' && rpsComputer === 'Rock') || (rpsChoice === 'Scissors' && rpsComputer === 'Paper') ? 'You win this round!' : 'Computer wins this round!'}</span><button className="button button-secondary" onClick={() => { setRpsChoice(null); setRpsComputer(null); }}>Play again</button></div>}</div> : prompt ? <div className="local-party-card">
      <span className="local-party-count">ROUND {promptIndex + 1}</span>
      <h3>{prompt.text}</h3>
      {gameId === 'would-you-rather' || gameId === 'this-or-that' ? <>
        <div className="party-choice-grid"><button className="party-choice" disabled={shown} onClick={() => recordVote('left')}><span>A</span>{prompt.left}</button><button className="party-choice alternate" disabled={shown} onClick={() => recordVote('right')}><span>B</span>{prompt.right}</button></div>
        <div className="party-vote-progress"><span>Voting: {shown ? 'complete' : safePlayers[Math.min(currentVoter, safePlayers.length - 1)]}</span><span>{Object.keys(votes).length}/{safePlayers.length}</span></div>
        {shown && <div className="party-results"><strong>Group results</strong><div><span>A</span><b>{tally.left} vote(s)</b></div><div><span>B</span><b>{tally.right} vote(s)</b></div></div>}
      </> : null}
      {gameId === 'never-have-i-ever' && <>
        <p className="party-instruction">Take turns. No one has to explain their answer.</p>
        <div className="party-choice-grid"><button className="party-choice" disabled={shown} onClick={() => recordVote('have')}>🙋 I have</button><button className="party-choice alternate" disabled={shown} onClick={() => recordVote('never')}>🙅 Never</button></div>
        <div className="party-vote-progress"><span>Answering: {shown ? 'round complete' : safePlayers[Math.min(currentVoter, safePlayers.length - 1)]}</span><span>{Object.keys(votes).length}/{safePlayers.length}</span></div>
        {shown && <div className="party-results"><div><span>I have</span><b>{tally.have}</b></div><div><span>Never</span><b>{tally.never}</b></div></div>}
      </>}
      {gameId === 'most-likely-to' && <>
        <p className="party-instruction">Everyone votes for someone in the group. Keep it kind.</p>
        <div className="party-player-votes">{safePlayers.map((name) => <button key={name} disabled={shown} onClick={() => voteForPlayer(name)}>{name}<span>{tally[name] ?? 0}</span></button>)}</div>
        <div className="party-vote-progress"><span>Voting: {shown ? 'complete' : safePlayers[Math.min(currentVoter, safePlayers.length - 1)]}</span><span>{Object.keys(votes).length}/{safePlayers.length}</span></div>
        {shown && <div className="party-results"><strong>Vote reveal</strong>{safePlayers.slice().sort((a,b) => (tally[b] ?? 0) - (tally[a] ?? 0)).map((name) => <div key={name}><span>{name}</span><b>{tally[name] ?? 0} vote(s)</b></div>)}</div>}
      </>}
      {['partner-quiz', 'our-story'].includes(gameId) && <>
        <p className="party-instruction">Take turns answering. After everybody has answered, discuss your favourites.</p>
        <button className="button button-primary local-reveal-button" onClick={() => setShown((value) => !value)}>{shown ? 'Hide prompt' : 'Mark answer / reveal discussion'}</button>
        {shown && <p className="party-reveal">Share your answer in your own words. There is no wrong answer.</p>}
      </>}
      {gameId === 'guess-word' && <>
        <p className="party-instruction">Act it out or describe it without saying the word. The group guesses.</p>
        <button className="button button-primary local-reveal-button" onClick={() => setShown((value) => !value)}>{shown ? 'Hide word' : 'Show word to performer'}</button>
        {shown && <p className="party-reveal">Your word: <strong>{prompt.text}</strong></p>}
      </>}
      <button className="button button-secondary local-next-button" onClick={() => { nextPrompt(); }}><ArrowRight size={16} /> Next round</button>
    </div> : <div className="empty-state"><h3>No prompts here yet</h3><button className="button button-primary" onClick={nextPrompt}>Try next</button></div>}
    <p className="local-party-safety"><ShieldCheck size={14} /> Local pass-the-phone version · Online voting and shared round state need the game sync migration. Skip any prompt you don’t like.</p>
    <button className="link-button" onClick={() => { setPromptIndex(0); setShown(false); setVotes({}); }}> <RefreshCw size={13} /> Reset game</button>
  </section>;
}
