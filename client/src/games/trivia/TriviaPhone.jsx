import { useState } from 'react';
import Timer from '../../shared/components/Timer';
import Rankings from '../../shared/components/Rankings';
import PlayAgainButton from '../../shared/components/PlayAgainButton';
import ConfettiCanvas from '../../shared/components/ConfettiCanvas';

const CHOICE_LABELS = ['A', 'B', 'C', 'D'];
const CHOICE_COLORS = [
  'border-accent text-accent',
  'border-p2-blue text-p2-blue',
  'border-gold text-gold',
  'border-teal text-teal',
];

function QuestionPhase({ gs, emit }) {
  const [answered, setAnswered] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(null);

  function handleAnswer(index) {
    emit('game:action', { type: 'answer', index });
    setSelectedIndex(index);
    setAnswered(true);
  }

  if (answered) {
    return (
      <div className="flex flex-col items-center gap-3">
        <div className="text-muted-light text-sm">{gs.roundName} — Q{gs.questionNum}/{gs.totalQuestions}</div>
        <Timer endsAt={gs.timer?.endsAt} className="text-2xl" />
        <p className="text-teal font-semibold">Answer locked in!</p>
        {selectedIndex != null && (
          <div className="ml-4 px-4 py-3 rounded-lg border border-muted/30 bg-surface-light/50 text-muted-light">
            {CHOICE_LABELS[selectedIndex]}. {gs.choices[selectedIndex]}
          </div>
        )}
        <div className="text-muted text-sm">{gs.answeredCount} / {gs.totalPlayers} answered</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="text-muted-light text-sm">{gs.roundName} — Q{gs.questionNum}/{gs.totalQuestions}</div>
      <Timer endsAt={gs.timer?.endsAt} className="text-2xl" />
      <p className="text-lg font-semibold">Pick your answer!</p>
      <div className="flex flex-col gap-3 w-full">
        {gs.choices.map((choice, i) => (
          <button
            key={i}
            onClick={() => handleAnswer(i)}
            className={`w-full py-4 px-5 text-left text-lg font-semibold rounded-lg border-2 bg-surface-light/50 transition-colors hover:bg-surface-light ${CHOICE_COLORS[i]}`}
          >
            <span className="font-bold mr-3">{CHOICE_LABELS[i]}.</span>
            {choice}
          </button>
        ))}
      </div>
      <div className="text-muted text-sm">{gs.answeredCount} / {gs.totalPlayers} answered</div>
    </div>
  );
}

export default function TriviaPhone({ gameState: gs, myId, isHost, players, emit }) {
  const questionKey = `${gs.round}-${gs.questionNum}`;

  if (gs.phase === 'error') {
    return <p className="text-error text-center">{gs.message}</p>;
  }

  if (gs.phase === 'question') {
    return <QuestionPhase key={questionKey} gs={gs} emit={emit} />;
  }

  if (gs.phase === 'preReveal') {
    return (
      <div className="flex flex-col items-center gap-3">
        <div className="text-muted-light text-sm">{gs.roundName} — Q{gs.questionNum}/{gs.totalQuestions}</div>
        <p className="text-xl font-bold animate-pulse">Get ready...</p>
      </div>
    );
  }

  if (gs.phase === 'reveal') {
    const myPlayer = players.find(p => p.id === myId);
    const me = gs.playerResults?.find(r => myPlayer && r.name === myPlayer.name);

    return (
      <div className="flex flex-col items-center gap-3">
        <div className="text-muted-light text-sm">{gs.roundName} — Q{gs.questionNum}/{gs.totalQuestions}</div>
        {me && (
          <p className={`text-2xl font-bold ${me.correct ? 'text-teal' : 'text-error'}`}>
            {me.correct ? 'Correct!' : 'Wrong!'}
          </p>
        )}
        <p className="text-muted-light">Your score: {gs.scores[myId] || 0}</p>
      </div>
    );
  }

  if (gs.phase === 'roundEnd') {
    return (
      <div className="flex flex-col items-center gap-3">
        <div className="text-lg font-bold">End of {gs.roundName} Round</div>
        <p className="text-muted-light">Your score: {gs.scores[myId] || 0}</p>
        <p className="text-muted text-sm">Next round starting soon...</p>
      </div>
    );
  }

  if (gs.phase === 'gameover') {
    const isWinner = gs.finalRanking.length > 0 && gs.finalRanking[0].id === myId;
    return (
      <div className="relative flex flex-col items-center gap-4">
        {isWinner && <ConfettiCanvas count={60} />}
        <div className="text-2xl font-bold">{isWinner ? 'You Won!' : 'Game Over!'}</div>
        <Rankings finalRanking={gs.finalRanking} />
        {isHost && <PlayAgainButton />}
      </div>
    );
  }

  return null;
}
