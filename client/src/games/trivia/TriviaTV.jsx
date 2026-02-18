import { useEffect, useRef } from 'react';
import Rankings from '../../shared/components/Rankings';
import ConfettiCanvas from '../../shared/components/ConfettiCanvas';
import Scoreboard from '../../shared/components/Scoreboard';
import AVATARS from '../../shared/avatars';
import PixelAvatar from '../../shared/components/PixelAvatar';
import QRCodeCanvas from '../../shared/components/QRCodeCanvas';
import { playSoundById } from '../../shared/sounds';

const CHOICE_LABELS = ['A', 'B', 'C', 'D'];
const CHOICE_BG = ['bg-red-600', 'bg-blue-600', 'bg-amber-500', 'bg-teal-600'];
const CHOICE_BAR = ['bg-red-500', 'bg-blue-500', 'bg-amber-400', 'bg-teal-500'];

function getAvatar(avatarId) {
  return AVATARS.find((a) => a.id === avatarId) || null;
}

function AnswerGrid({ choices, highlightIndex = null, dimOthers = false }) {
  return (
    <div className="grid grid-cols-2 gap-4 w-full flex-1">
      {choices.map((choice, i) => {
        const isHighlighted = highlightIndex === i;
        const isDimmed = dimOthers && highlightIndex !== null && !isHighlighted;
        return (
          <div
            key={i}
            className={`${CHOICE_BG[i]} flex flex-col items-center justify-center rounded-2xl p-6 transition-all duration-500 ${
              isHighlighted ? 'ring-4 ring-white scale-105' : ''
            } ${isDimmed ? 'opacity-30' : ''}`}
          >
            <span className="text-3xl font-black text-white/80 mb-2">{CHOICE_LABELS[i]}</span>
            <span className="text-2xl font-bold text-white text-center leading-snug">{choice}</span>
          </div>
        );
      })}
    </div>
  );
}

function CharacterSelectPhase({ gs, players }) {
  const phoneUrl = window.location.origin + '/phone';
  const soundedRef = useRef(new Set());

  useEffect(() => {
    for (const player of players) {
      if (player.noiseId && !soundedRef.current.has(player.id)) {
        soundedRef.current.add(player.id);
        playSoundById(player.noiseId);
      }
    }
  }, [players]);

  return (
    <div
      className="h-screen flex bg-cover bg-center"
      style={{ backgroundImage: 'url(/tv/lobby-background.jpg)' }}
    >
      <div className="flex-1 flex flex-col items-center justify-center gap-8 p-10 bg-black/50">
        <h1 className="text-5xl font-bold text-white">Choose your character!</h1>
        <div className="flex flex-wrap justify-center gap-6">
          {players.map((p) => {
            const avatar = getAvatar(p.avatarId);
            return (
              <div key={p.id} className="flex flex-col items-center gap-2">
                {avatar
                  ? <PixelAvatar avatar={avatar} size={72} />
                  : <div className="w-[72px] h-[72px] rounded-full border-2 border-white/30 bg-white/10 flex items-center justify-center">
                      <span className="text-white/40 text-2xl">?</span>
                    </div>
                }
                <span className="text-white text-lg font-semibold">{p.name}</span>
                {p.avatarId && <span className="text-white/60 text-sm">Ready</span>}
              </div>
            );
          })}
        </div>
        <p className="text-white/60 text-xl">Waiting for host to start...</p>
      </div>
      {!gs.joinLocked && (
        <div className="flex flex-col items-center justify-center gap-4 p-8 bg-black/60">
          <QRCodeCanvas url={phoneUrl} size={180} />
          <p className="text-white/60 text-sm">Scan to join</p>
        </div>
      )}
    </div>
  );
}

function QuestionPhase({ gs }) {
  return (
    <div
      className="h-screen flex flex-col p-6 gap-4 bg-cover bg-center"
      style={{ backgroundImage: 'url(/tv/background.jpg)' }}
    >
      <div className="flex justify-between items-center text-white/70 text-lg bg-black/40 rounded-xl px-4 py-2">
        <span>{gs.roundName} · Q{gs.questionNum}/{gs.totalQuestions}</span>
        <span>{gs.answeredCount}/{gs.totalPlayers} answered</span>
      </div>
      <div className="text-3xl font-bold text-white text-center leading-snug px-4 py-2 bg-black/40 rounded-xl">
        {gs.question}
      </div>
      <AnswerGrid choices={gs.choices} />
    </div>
  );
}

function PreRevealPhase({ gs }) {
  return (
    <div
      className="h-screen flex flex-col p-6 gap-4 bg-cover bg-center"
      style={{ backgroundImage: 'url(/tv/background.jpg)' }}
    >
      <div className="flex justify-between items-center text-white/70 text-lg bg-black/40 rounded-xl px-4 py-2">
        <span>{gs.roundName} · Q{gs.questionNum}/{gs.totalQuestions}</span>
      </div>
      <div className="text-3xl font-bold text-white text-center leading-snug px-4 py-2 bg-black/40 rounded-xl">
        {gs.question}
      </div>
      <AnswerGrid choices={gs.choices} highlightIndex={gs.correctIndex} dimOthers={true} />
    </div>
  );
}

function RevealPhase({ gs, players }) {
  const counts = gs.choiceCounts || [0, 0, 0, 0];
  const maxCount = Math.max(...counts, 1);

  return (
    <div
      className="h-screen flex flex-col p-6 gap-4 bg-cover bg-center"
      style={{ backgroundImage: 'url(/tv/background.jpg)' }}
    >
      <div className="text-2xl font-bold text-white text-center bg-black/40 rounded-xl px-4 py-2">
        {gs.question}
      </div>
      <div className="flex-1 flex items-end justify-center gap-8 pb-8">
        {gs.choices.map((choice, i) => {
          const count = counts[i];
          const heightPct = (count / maxCount) * 100;
          const isCorrect = i === gs.correctIndex;
          return (
            <div key={i} className="flex flex-col items-center gap-2 flex-1 max-w-[200px]">
              <span className={`text-2xl font-bold ${isCorrect ? 'text-white' : 'text-white/60'}`}>
                {count} {isCorrect && '✓'}
              </span>
              <div
                className={`w-full rounded-t-xl transition-all duration-700 ${CHOICE_BAR[i]} ${isCorrect ? '' : 'opacity-60'}`}
                style={{ height: `${Math.max(heightPct, 4)}%` }}
              />
              <div className={`${CHOICE_BG[i]} w-full rounded-b-xl px-2 py-3 text-center ${isCorrect ? '' : 'opacity-60'}`}>
                <span className="text-white font-bold text-sm block">{CHOICE_LABELS[i]}</span>
                <span className="text-white/80 text-xs">{choice}</span>
              </div>
            </div>
          );
        })}
      </div>
      <Scoreboard scores={gs.scores} players={players} />
    </div>
  );
}

export default function TriviaTV({ gameState: gs, players }) {
  const countdownRef = useRef(null);
  const gongRef = useRef(null);

  function stopAll() {
    if (countdownRef.current) {
      countdownRef.current.pause();
      countdownRef.current = null;
    }
    if (gongRef.current) {
      gongRef.current.pause();
      gongRef.current = null;
    }
  }

  useEffect(() => {
    if (gs.phase === 'question') {
      stopAll();
      const audio = new Audio('/tv/countdown.mp3');
      audio.play().catch(() => {});
      countdownRef.current = audio;
    } else if (gs.phase === 'preReveal') {
      if (gs.earlyEnd) {
        stopAll();
        const audio = new Audio('/tv/gong.mp3');
        audio.play().catch(() => {});
        gongRef.current = audio;
      }
      // Natural timeout: countdown.mp3 keeps playing through its cooldown section
    } else {
      stopAll();
    }

    return () => {
      // cleanup only on unmount
    };
  }, [gs.phase, gs.round, gs.questionNum]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    return () => stopAll();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (gs.phase === 'error') {
    return <p className="text-error text-center text-2xl">{gs.message}</p>;
  }

  if (gs.phase === 'characterSelect') {
    return <CharacterSelectPhase gs={gs} players={players} />;
  }

  if (gs.phase === 'question') {
    return <QuestionPhase gs={gs} />;
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
