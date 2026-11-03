import { useState, useEffect, useCallback, useRef } from 'react';
import { useSocket } from '../shared/context/SocketContext';
import JoinScreen from './screens/JoinScreen';
import WaitingScreen from './screens/WaitingScreen';
import LobbyHostScreen from './screens/LobbyHostScreen';
import LobbyPlayerScreen from './screens/LobbyPlayerScreen';
import PlayingScreen from './screens/PlayingScreen';

export default function App({ onInvalidCode }) {
  const { sessionState, myId, emit, socket } = useSocket();
  const [joined, setJoined] = useState(false);
  const [error, setError] = useState(null);
  const joinedRef = useRef(false);

  useEffect(() => {
    if (!socket) return;
    const handler = (data) => {
      if (data.message === 'Invalid game code') {
        onInvalidCode?.();
        return;
      }
      setError(data.message);
      setJoined(false);
      joinedRef.current = false;
    };
    socket.on('error', handler);
    return () => socket.off('error', handler);
  }, [socket, onInvalidCode]);

  useEffect(() => {
    if (!sessionState) return;
    const amPlayer = sessionState.players.some((p) => p.id === myId);
    if (sessionState.state === 'waiting' && joinedRef.current && !amPlayer) {
      setJoined(false);
      joinedRef.current = false;
    }
  }, [sessionState, myId]);

  const handleJoin = useCallback((name, accessCode) => {
    setError(null);
    emit('player:join', { name, avatarId: null, noiseId: null, accessCode });
    setJoined(true);
    joinedRef.current = true;
  }, [emit]);

  if (!sessionState) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <p className="text-muted-light">Connecting...</p>
      </div>
    );
  }

  const amPlayer = sessionState.players.some((p) => p.id === myId);
  const amHost = sessionState.players.some((p) => p.id === myId && p.isHost);

  if (sessionState.state === 'waiting') {
    if (joined) return <WaitingScreen />;
    return (
      <JoinScreen
        onJoin={handleJoin}
        error={error}
        requireAuth={sessionState.hostAuthRequired}
      />
    );
  }

  if (!amPlayer) {
    return <JoinScreen onJoin={handleJoin} error={error} />;
  }

  if (sessionState.state === 'lobby') {
    if (amHost) return <LobbyHostScreen players={sessionState.players} />;
    return <LobbyPlayerScreen players={sessionState.players} />;
  }

  if (sessionState.state === 'playing') {
    return (
      <PlayingScreen
        state={sessionState}
        myId={myId}
        isHost={amHost}
      />
    );
  }

  return <JoinScreen onJoin={handleJoin} error={error} />;
}
