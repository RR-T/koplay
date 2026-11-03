import { useState, useRef, useEffect } from 'react';
import { useSocket } from '../shared/context/SocketContext';
import IntroScreen from './screens/IntroScreen';
import WaitingScreen from './screens/WaitingScreen';
import LobbyScreen from './screens/LobbyScreen';
import PlayingScreen from './screens/PlayingScreen';

export default function App({ skipIntro = false }) {
  const { sessionState } = useSocket();
  const [introFinished, setIntroFinished] = useState(skipIntro);
  const pendingStateRef = useRef(null);
  const [activeState, setActiveState] = useState(null);

  useEffect(() => {
    if (!sessionState) return;

    if (!introFinished) {
      pendingStateRef.current = sessionState;
      return;
    }

    setActiveState(sessionState);
  }, [sessionState, introFinished]);

  function handleIntroComplete() {
    setIntroFinished(true);
    if (pendingStateRef.current) {
      setActiveState(pendingStateRef.current);
      pendingStateRef.current = null;
    }
  }

  if (!introFinished) {
    return <IntroScreen onComplete={handleIntroComplete} />;
  }

  const gameCode = activeState?.gameCode || null;

  if (!activeState || activeState.state === 'waiting') {
    return <WaitingScreen gameCode={gameCode} />;
  }

  if (activeState.state === 'lobby') {
    return <LobbyScreen players={activeState.players} gameCode={gameCode} />;
  }

  if (activeState.state === 'playing') {
    return <PlayingScreen state={activeState} />;
  }

  return <WaitingScreen gameCode={gameCode} />;
}
