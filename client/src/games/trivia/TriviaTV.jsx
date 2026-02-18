import { useEffect, useRef, useState } from 'react';
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

function AnswerGrid({ choices, highlightIndex = null, dimOthers = false, className = 'flex-1' }) {
  return (
    <div className={`grid grid-cols-2 gap-4 w-full ${className}`}>
      {choices.map((choice, i) => {
        const isHighlighted = highlightIndex === i;
        const isDimmed = dimOthers && highlightIndex !== null && !isHighlighted;
        return (
          <div
            key={i}
            className={`${CHOICE_BG[i]} flex flex-col items-center justify-center rounded-2xl p-4 transition-all duration-500 ${
              isHighlighted ? 'ring-4 ring-white scale-105' : ''
            } ${isDimmed ? 'opacity-30' : ''}`}
          >
            <span className="text-2xl font-black text-white/80 mb-1">{CHOICE_LABELS[i]}</span>
            <span className="text-lg font-bold text-white text-center leading-snug">{choice}</span>
          </div>
        );
      })}
    </div>
  );
}

function AnsweredRow({ entries }) {
  return (
    <div className="flex items-center gap-4 bg-black/40 rounded-xl px-6 py-3">
      <span className="text-white/50 text-lg font-semibold shrink-0">Answered</span>
      <div className="flex gap-3 flex-wrap">
        {entries.map((entry, i) => {
          const avatar = getAvatar(entry.avatarId);
          if (!avatar) return null;
          return (
            <div key={i} className={entry.correct === false ? 'opacity-40' : ''}>
              <PixelAvatar avatar={avatar} size={40} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RoundIntroPhase({ gs }) {
  return (
    <div
      className="h-screen flex flex-col items-center justify-center gap-6 bg-cover bg-center"
      style={{ backgroundImage: 'url(/tv/background.jpg)' }}
    >
      <div className="bg-black/60 rounded-3xl px-20 py-14 flex flex-col items-center gap-4">
        <p className="text-white/60 text-3xl font-semibold uppercase tracking-widest">
          Round {gs.round} of {gs.totalRounds}
        </p>
        <p className="text-9xl font-black text-white">{gs.roundName}</p>
      </div>
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

function QuestionPhase({ gs, showAnswers }) {
  return (
    <div
      className="h-screen flex flex-col p-6 gap-4 bg-cover bg-center"
      style={{ backgroundImage: 'url(/tv/background.jpg)' }}
    >
      <div className="flex items-center text-white/70 text-lg bg-black/40 rounded-xl px-4 py-2">
        <span>{gs.roundName} · Q{gs.questionNum}/{gs.totalQuestions}</span>
      </div>
      <div className="flex-[2] flex items-center justify-center px-6 py-4 bg-black/40 rounded-xl">
        <p className="text-7xl font-bold text-white text-center leading-tight">{gs.question}</p>
      </div>
      {showAnswers && (
        <>
          <AnswerGrid choices={gs.choices} />
          <AnsweredRow entries={gs.recentAnswers} />
        </>
      )}
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

      {/* Bars — all anchored to the same baseline, height driven by vote count */}
      <div className="flex-1 flex items-end gap-6 px-8">
        {gs.choices.map((choice, i) => {
          const count = counts[i];
          const isCorrect = i === gs.correctIndex;
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <span className={`text-2xl font-bold ${isCorrect ? 'text-white' : 'text-white/60'}`}>
                {count}{isCorrect ? ' ✓' : ''}
              </span>
              <div
                className={`w-full rounded-t-xl transition-all duration-700 ${CHOICE_BAR[i]} ${isCorrect ? '' : 'opacity-60'}`}
                style={{ height: `${(count / maxCount) * 50}vh` }}
              />
            </div>
          );
        })}
      </div>

      {/* Labels — separate fixed row below the bars */}
      <div className="flex gap-6 px-8">
        {gs.choices.map((choice, i) => {
          const isCorrect = i === gs.correctIndex;
          return (
            <div
              key={i}
              className={`flex-1 rounded-xl px-3 py-3 text-center ${CHOICE_BG[i]} ${isCorrect ? '' : 'opacity-60'}`}
            >
              <span className="text-white font-bold text-lg block">{CHOICE_LABELS[i]}</span>
              <span className="text-white/90 text-sm leading-snug">{choice}</span>
            </div>
          );
        })}
      </div>

      <AnsweredRow entries={gs.playerResults || []} />
    </div>
  );
}

export default function TriviaTV({ gameState: gs, players }) {
  const [showAnswers, setShowAnswers] = useState(false);
  const countdownRef = useRef(null);
  const gongRef = useRef(null);
  const gongTimerRef = useRef(null);
  const questionAudioRef = useRef(null);
  const lobbyAudioRef = useRef(null);
  const showAnswersTimerRef = useRef(null);
  const answersProcessedRef = useRef(new Set());

  function stopAll() {
    if (showAnswersTimerRef.current) {
      clearTimeout(showAnswersTimerRef.current);
      showAnswersTimerRef.current = null;
    }
    if (questionAudioRef.current) {
      questionAudioRef.current.pause();
      questionAudioRef.current = null;
    }
    if (gongTimerRef.current) {
      clearTimeout(gongTimerRef.current);
      gongTimerRef.current = null;
    }
    if (countdownRef.current) {
      countdownRef.current.pause();
      countdownRef.current = null;
    }
    if (gongRef.current) {
      gongRef.current.pause();
      gongRef.current = null;
    }
    if (lobbyAudioRef.current) {
      lobbyAudioRef.current.pause();
      lobbyAudioRef.current = null;
    }
  }

  // Reset answer tracking on each new question
  useEffect(() => {
    answersProcessedRef.current = new Set();
  }, [gs.round, gs.questionNum]);

  // Play each player's sound as they answer — runs regardless of phase so the
  // last answer is heard even when the server transitions to preReveal in the
  // same broadcast
  useEffect(() => {
    if (!gs.recentAnswers) return;
    for (const entry of gs.recentAnswers) {
      if (!answersProcessedRef.current.has(entry.playerId)) {
        answersProcessedRef.current.add(entry.playerId);
        if (entry.noiseId) playSoundById(entry.noiseId);
      }
    }
  }, [gs.recentAnswers]); // eslint-disable-line react-hooks/exhaustive-deps

  // Lobby music — looping while on character select screen
  useEffect(() => {
    if (gs.phase === 'characterSelect') {
      const audio = new Audio('/tv/lobby.mp3');
      audio.loop = true;
      audio.play().catch(() => {});
      lobbyAudioRef.current = audio;
    } else {
      if (lobbyAudioRef.current) {
        lobbyAudioRef.current.pause();
        lobbyAudioRef.current = null;
      }
    }
    return () => {
      if (lobbyAudioRef.current) {
        lobbyAudioRef.current.pause();
        lobbyAudioRef.current = null;
      }
    };
  }, [gs.phase]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (gs.phase === 'roundIntro') {
      stopAll();
      const audio = new Audio('/tv/round_start.wav');
      audio.play().catch(() => {});
      questionAudioRef.current = audio;
    } else if (gs.phase === 'question') {
      stopAll();
      setShowAnswers(false);
      // Play question.mp3 while the question is displayed before answers appear
      const qAudio = new Audio('/tv/question.mp3');
      qAudio.play().catch(() => {});
      questionAudioRef.current = qAudio;
      // After 3s, reveal answers and start the countdown music
      showAnswersTimerRef.current = setTimeout(() => {
        showAnswersTimerRef.current = null;
        if (questionAudioRef.current) {
          questionAudioRef.current.pause();
          questionAudioRef.current = null;
        }
        const cdAudio = new Audio('/tv/countdown.mp3');
        cdAudio.play().catch(() => {});
        countdownRef.current = cdAudio;
        setShowAnswers(true);
      }, 3000);
    } else if (gs.phase === 'reveal') {
      if (gs.earlyEnd) {
        // Stop countdown, wait 1s for last player's sound then play gong
        stopAll();
        gongTimerRef.current = setTimeout(() => {
          gongTimerRef.current = null;
          const audio = new Audio('/tv/gong.mp3');
          audio.play().catch(() => {});
          gongRef.current = audio;
        }, 1000);
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

  if (gs.phase === 'roundIntro') {
    return <RoundIntroPhase gs={gs} />;
  }

  if (gs.phase === 'question') {
    return <QuestionPhase gs={gs} showAnswers={showAnswers} />;
  }

  if (gs.phase === 'reveal') {
    return <RevealPhase gs={gs} players={players} />;
  }

  if (gs.phase === 'roundEnd') {
    const isLastRound = gs.round === gs.totalRounds;
    return (
      <div
        className="relative h-screen flex flex-col items-center justify-center gap-8 w-full px-8 bg-cover bg-center"
        style={{ backgroundImage: 'url(/tv/background.jpg)' }}
      >
        {isLastRound && <ConfettiCanvas />}
        <div className="text-5xl font-black text-white">
          {isLastRound ? 'Final Scores!' : `End of ${gs.roundName} Round`}
        </div>
        <Scoreboard scores={gs.scores} players={players} />
        {!isLastRound && (
          <div className="text-white/60 text-2xl">Next round starting soon...</div>
        )}
      </div>
    );
  }

  if (gs.phase === 'gameover') {
    return (
      <div className="relative flex flex-col items-center gap-8 w-full px-8">
        <div className="text-6xl font-bold">Game Over!</div>
        <Rankings finalRanking={gs.finalRanking} />
      </div>
    );
  }

  return null;
}
