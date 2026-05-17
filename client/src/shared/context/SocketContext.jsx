import { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

export function SocketProvider({ role, children }) {
  const socketRef = useRef(null);
  const [sessionState, setSessionState] = useState(null);
  const [myId, setMyId] = useState(null);

  useEffect(() => {
    const socket = io({ query: { role } });
    socketRef.current = socket;

    socket.on('connect', () => setMyId(socket.id));
    socket.on('session:state', (state) => setSessionState(state));

    return () => socket.disconnect();
  }, [role]);

  const emit = useCallback((event, ...args) => {
    socketRef.current?.emit(event, ...args);
  }, []);

  const value = { socket: socketRef.current, sessionState, myId, emit };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}
