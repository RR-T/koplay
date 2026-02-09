import { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

export function SocketProvider({ role, children }) {
  const socketRef = useRef(null);
  const [sessionState, setSessionState] = useState(null);
  const [myId, setMyId] = useState(null);
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    const socket = io({ query: { role } });
    socketRef.current = socket;

    socket.on('connect', () => setMyId(socket.id));
    socket.on('session:state', (state) => setSessionState(state));
    socket.on('tv:blocked', () => setBlocked(true));

    return () => socket.disconnect();
  }, [role]);

  const emit = useCallback((event, data) => {
    socketRef.current?.emit(event, data);
  }, []);

  const value = { socket: socketRef.current, sessionState, myId, emit, blocked };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}
