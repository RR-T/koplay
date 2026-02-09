import Timer from '../../shared/components/Timer';
import Scoreboard from '../../shared/components/Scoreboard';
import Rankings from '../../shared/components/Rankings';
import ConfettiCanvas from '../../shared/components/ConfettiCanvas';

export default function AcrophobiaTV({ gameState: gs, players }) {
  if (gs.phase === 'error') {
    return <p className="text-error text-center text-xl">{gs.message}</p>;
  }

  if (gs.phase === 'submitting') {
    return (
      <div className="flex flex-col items-center gap-4 w-full">
        <div className="text-muted-light">Round {gs.round} / {gs.totalRounds}</div>
        <div className="text-6xl font-bold text-accent tracking-widest">{gs.acronym}</div>
        <Timer endsAt={gs.timer?.endsAt} />
        <div className="text-muted-light text-lg">{gs.submittedCount} / {gs.totalPlayers} submitted</div>
        <Scoreboard scores={gs.scores} players={players} />
      </div>
    );
  }

  if (gs.phase === 'voting') {
    return (
      <div className="flex flex-col items-center gap-4 w-full">
        <div className="text-muted-light">Round {gs.round} / {gs.totalRounds}</div>
        <div className="text-6xl font-bold text-accent tracking-widest">{gs.acronym}</div>
        <Timer endsAt={gs.timer?.endsAt} />
        <ul className="flex flex-col gap-2 w-full max-w-lg">
          {gs.votingOptions.map((opt) => (
            <li key={opt.index} className="flex items-center gap-3 px-4 py-3 bg-surface-light/50 rounded-lg border-l-3 border-accent/30">
              <span className="text-accent font-bold">{opt.index + 1}.</span>
              <span className="text-lg">{opt.text}</span>
            </li>
          ))}
        </ul>
        <div className="text-muted-light">{gs.votedCount} voted</div>
        <Scoreboard scores={gs.scores} players={players} />
      </div>
    );
  }

  if (gs.phase === 'results') {
    const sorted = [...gs.results].sort((a, b) => b.votes - a.votes);
    return (
      <div className="flex flex-col items-center gap-4 w-full">
        <div className="text-muted-light">Round {gs.round} / {gs.totalRounds}</div>
        <div className="text-6xl font-bold text-accent tracking-widest">{gs.acronym}</div>
        <ul className="flex flex-col gap-2 w-full max-w-lg">
          {sorted.map((r, i) => (
            <li key={i} className={`flex items-center justify-between px-4 py-3 rounded-lg ${r.votes > 0 ? 'bg-surface-light/50 border-l-3 border-accent' : 'bg-surface-light/30'}`}>
              <div>
                <div className="text-lg">{r.text}</div>
                <div className="text-sm text-muted-light">{r.author}</div>
              </div>
              <span className="text-accent font-bold">{r.votes} vote{r.votes !== 1 ? 's' : ''}</span>
            </li>
          ))}
        </ul>
        <Scoreboard scores={gs.scores} players={players} />
      </div>
    );
  }

  if (gs.phase === 'gameover') {
    return (
      <div className="relative flex flex-col items-center gap-6 w-full">
        <ConfettiCanvas />
        <div className="text-4xl font-bold">Game Over!</div>
        <Rankings finalRanking={gs.finalRanking} />
      </div>
    );
  }

  return null;
}
