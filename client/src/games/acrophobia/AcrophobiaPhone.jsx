import { useState, useEffect, useRef } from 'react';
import Timer from '../../shared/components/Timer';
import Rankings from '../../shared/components/Rankings';
import PlayAgainButton from '../../shared/components/PlayAgainButton';

function SubmitPhase({ gs, emit }) {
  const [text, setText] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function validate(value) {
    const trimmed = value.trim();
    if (!trimmed) return { valid: false, message: '' };
    const words = trimmed.split(/\s+/);
    if (words.length !== gs.acronym.length) {
      return { valid: false, message: `Need ${gs.acronym.length} words (got ${words.length})` };
    }
    for (let i = 0; i < words.length; i++) {
      if (words[i][0].toUpperCase() !== gs.acronym[i]) {
        return { valid: false, message: `Word ${i + 1} must start with "${gs.acronym[i]}"` };
      }
    }
    return { valid: true, message: 'Looks good!' };
  }

  function handleSubmit(e) {
    e.preventDefault();
    const { valid } = validate(text);
    if (!valid) return;
    emit('game:action', { type: 'submit', text: text.trim() });
    setSubmitted(true);
  }

  const { valid, message } = validate(text);

  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-3">
        <div className="text-muted-light text-sm">Round {gs.round} / {gs.totalRounds}</div>
        <div className="text-3xl font-bold text-accent tracking-widest">{gs.acronym}</div>
        <Timer endsAt={gs.timer?.endsAt} className="text-2xl" />
        <p className="text-teal font-semibold">Submitted! Waiting for others...</p>
        <div className="text-muted text-sm">{gs.submittedCount} / {gs.totalPlayers}</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="text-muted-light text-sm">Round {gs.round} / {gs.totalRounds}</div>
      <div className="text-3xl font-bold text-accent tracking-widest">{gs.acronym}</div>
      <Timer endsAt={gs.timer?.endsAt} className="text-2xl" />
      <form onSubmit={handleSubmit} className="w-full flex flex-col gap-3">
        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type your acronym..."
          maxLength={200}
          autoComplete="off"
          className="w-full px-4 py-3 bg-surface-light border border-muted/30 rounded-lg text-center text-lg text-white placeholder-muted focus:border-accent focus:outline-none"
        />
        <div className="text-xs text-muted text-center">
          Each word must start with: {gs.acronym.split('').join(', ')}
        </div>
        <div className={`text-sm text-center min-h-5 ${valid ? 'text-teal' : 'text-error'}`}>
          {message}
        </div>
        <button
          type="submit"
          disabled={!valid}
          className="w-full py-3 bg-accent hover:bg-accent-hover disabled:bg-muted text-white text-lg font-semibold rounded-lg transition-colors"
        >
          Submit
        </button>
      </form>
      <div className="text-muted text-sm">{gs.submittedCount} / {gs.totalPlayers}</div>
    </div>
  );
}

function VotingPhase({ gs, emit }) {
  const [voted, setVoted] = useState(false);

  function handleVote(index) {
    emit('game:action', { type: 'vote', index });
    setVoted(true);
  }

  if (voted) {
    return (
      <div className="flex flex-col items-center gap-3">
        <div className="text-muted-light text-sm">Round {gs.round} / {gs.totalRounds}</div>
        <div className="text-3xl font-bold text-accent tracking-widest">{gs.acronym}</div>
        <Timer endsAt={gs.timer?.endsAt} className="text-2xl" />
        <p className="text-teal font-semibold">Voted! Waiting for others...</p>
        <div className="text-muted text-sm">{gs.votedCount} voted</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="text-muted-light text-sm">Round {gs.round} / {gs.totalRounds}</div>
      <div className="text-3xl font-bold text-accent tracking-widest">{gs.acronym}</div>
      <Timer endsAt={gs.timer?.endsAt} className="text-2xl" />
      <p className="text-lg font-semibold">Vote for your favorite!</p>
      <div className="w-full flex flex-col gap-2">
        {gs.votingOptions.map((opt) => (
          <button
            key={opt.index}
            onClick={() => handleVote(opt.index)}
            className="w-full text-left px-4 py-3 bg-surface-light rounded-lg border border-muted/20 hover:border-accent transition-colors text-base"
          >
            {opt.text}
          </button>
        ))}
      </div>
      <div className="text-muted text-sm">{gs.votedCount} voted</div>
    </div>
  );
}

function ResultsPhase({ gs, myId }) {
  const sorted = [...gs.results].sort((a, b) => b.votes - a.votes);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="text-muted-light text-sm">Round {gs.round} / {gs.totalRounds}</div>
      <div className="text-3xl font-bold text-accent tracking-widest">{gs.acronym}</div>
      <div className="w-full flex flex-col gap-2">
        {sorted.map((r, i) => (
          <div
            key={i}
            className={`px-4 py-3 rounded-lg ${
              r.authorId === myId ? 'border-l-3 border-accent bg-surface-light/70' : 'bg-surface-light/40'
            }`}
          >
            <div className="text-base">{r.text}</div>
            <div className="text-sm text-muted-light">
              {r.author} — {r.votes} vote{r.votes !== 1 ? 's' : ''}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AcrophobiaPhone({ gameState: gs, myId, isHost, players, emit }) {
  // Track round changes to reset sub-component state via key
  const roundKey = `${gs.phase}-${gs.round}`;

  if (gs.phase === 'error') {
    return <p className="text-error text-center">{gs.message}</p>;
  }

  if (gs.phase === 'submitting') {
    return <SubmitPhase key={roundKey} gs={gs} emit={emit} />;
  }

  if (gs.phase === 'voting') {
    return <VotingPhase key={roundKey} gs={gs} emit={emit} />;
  }

  if (gs.phase === 'results') {
    return <ResultsPhase gs={gs} myId={myId} />;
  }

  if (gs.phase === 'gameover') {
    return (
      <div className="flex flex-col items-center gap-4">
        <div className="text-2xl font-bold">Game Over!</div>
        <Rankings finalRanking={gs.finalRanking} />
        {isHost && <PlayAgainButton />}
      </div>
    );
  }

  return null;
}
