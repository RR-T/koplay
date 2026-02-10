import { useState, useEffect, useRef } from 'react';
import Timer from '../../shared/components/Timer';
import Scoreboard from '../../shared/components/Scoreboard';
import Rankings from '../../shared/components/Rankings';
import ConfettiCanvas from '../../shared/components/ConfettiCanvas';
import AVATARS from '../../shared/avatars';
import PixelAvatar from '../../shared/components/PixelAvatar';
import { playSoundById } from '../../shared/sounds';

function getAvatar(avatarId) {
  return AVATARS.find((a) => a.id === avatarId) || null;
}

function QuestionPhase({ gs, players }) {
  const [displayedAnswers, setDisplayedAnswers] = useState([]);
  const processedRef = useRef(new Set());

  // Reset on new question
  useEffect(() => {
    setDisplayedAnswers([]);
    processedRef.current = new Set();
  }, [gs.round, gs.questionNum]);

  // Process new answers — play sounds and show avatars
  useEffect(() => {
    if (!gs.recentAnswers) return;
    for (const entry of gs.recentAnswers) {
      if (!processedRef.current.has(entry.playerId)) {
        processedRef.current.add(entry.playerId);
        if (entry.noiseId) playSoundById(entry.noiseId);
        const player = players.find((p) => p.id === entry.playerId);
        setDisplayedAnswers((prev) => [
          ...prev,
          {
            playerId: entry.playerId,
            avatarId: entry.avatarId,
            name: player ? player.name : '?',
          },
        ]);
      }
    }
  }, [gs.recentAnswers, players]);

  return (
    <div className="flex flex-col items-center gap-8 w-full px-8">
      <div className="flex justify-between w-full text-muted-light text-2xl">
        <span>{gs.roundName} — Round {gs.round}/{gs.totalRounds}</span>
        <span>Question {gs.questionNum}/{gs.totalQuestions}</span>
      </div>
      <Timer endsAt={gs.timer?.endsAt} className="text-6xl" />
      <div className="text-5xl font-bold text-center leading-snug max-w-5xl">{gs.question}</div>
      <div className="text-muted-light text-2xl">{gs.answeredCount} / {gs.totalPlayers} answered</div>
      {displayedAnswers.length > 0 && (
        <div className="flex flex-wrap justify-center gap-6 mt-4">
          {displayedAnswers.map((a) => {
            const avatar = getAvatar(a.avatarId);
            return (
              <div key={a.playerId} className="flex flex-col items-center gap-2 animate-bounce-in">
                {avatar && <PixelAvatar avatar={avatar} size={72} />}
                <span className="text-lg text-muted-light">{a.name}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function PreRevealPhase({ gs }) {
  return (
    <div className="flex flex-col items-center gap-8 w-full px-8">
      <div className="flex justify-between w-full text-muted-light text-2xl">
        <span>{gs.roundName} — Round {gs.round}/{gs.totalRounds}</span>
        <span>Question {gs.questionNum}/{gs.totalQuestions}</span>
      </div>
      <div className="text-5xl font-bold text-center leading-snug max-w-5xl">{gs.question}</div>
      <div className="text-4xl text-accent font-bold animate-pulse">Revealing answer...</div>
    </div>
  );
}

function RevealPhase({ gs, players }) {
  const correct = gs.playerResults ? gs.playerResults.filter((r) => r.correct) : [];
  const incorrect = gs.playerResults ? gs.playerResults.filter((r) => !r.correct) : [];

  return (
    <div className="flex flex-col items-center gap-8 w-full px-8">
      <div className="flex justify-between w-full text-muted-light text-2xl">
        <span>{gs.roundName} — Round {gs.round}/{gs.totalRounds}</span>
        <span>Question {gs.questionNum}/{gs.totalQuestions}</span>
      </div>
      <div className="text-4xl font-bold text-center leading-snug max-w-5xl">{gs.question}</div>
      <div className="text-4xl font-bold text-teal">{gs.choices[gs.correctIndex]}</div>

      <div className="flex gap-12 mt-4">
        {correct.length > 0 && (
          <div className="flex flex-col items-center gap-4">
            <span className="text-teal font-bold text-2xl">Correct</span>
            <div className="flex flex-wrap justify-center gap-6">
              {correct.map((r) => {
                const avatar = getAvatar(r.avatarId);
                return (
                  <div key={r.name} className="flex flex-col items-center gap-2 animate-bounce-in">
                    {avatar && <PixelAvatar avatar={avatar} size={64} />}
                    <span className="text-lg text-teal">{r.name}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {incorrect.length > 0 && (
          <div className="flex flex-col items-center gap-4">
            <span className="text-error font-bold text-2xl">Incorrect</span>
            <div className="flex flex-wrap justify-center gap-6">
              {incorrect.map((r) => {
                const avatar = getAvatar(r.avatarId);
                return (
                  <div key={r.name} className="flex flex-col items-center gap-2 animate-bounce-in">
                    {avatar && <PixelAvatar avatar={avatar} size={64} className="opacity-60" />}
                    <span className="text-lg text-error/70">{r.name}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {correct.length === 0 && (
        <span className="text-error text-2xl font-semibold">Nobody got it!</span>
      )}

      <Scoreboard scores={gs.scores} players={players} />
    </div>
  );
}

export default function TriviaTV({ gameState: gs, players }) {
  if (gs.phase === 'error') {
    return <p className="text-error text-center text-2xl">{gs.message}</p>;
  }

  if (gs.phase === 'question') {
    return <QuestionPhase gs={gs} players={players} />;
  }

  if (gs.phase === 'preReveal') {
    return <PreRevealPhase gs={gs} />;
  }

  if (gs.phase === 'reveal') {
    return <RevealPhase gs={gs} players={players} />;
  }

  if (gs.phase === 'roundEnd') {
    return (
      <div className="flex flex-col items-center gap-8 w-full px-8">
        <div className="text-4xl font-bold">End of {gs.roundName} Round</div>
        <Scoreboard scores={gs.scores} players={players} />
        <div className="text-muted-light text-2xl">Next round starting soon...</div>
      </div>
    );
  }

  if (gs.phase === 'gameover') {
    return (
      <div className="relative flex flex-col items-center gap-8 w-full px-8">
        <ConfettiCanvas />
        <div className="text-6xl font-bold">Game Over!</div>
        <Rankings finalRanking={gs.finalRanking} />
      </div>
    );
  }

  return null;
}
