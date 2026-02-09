import { Suspense } from 'react';
import { useSocket } from '../../shared/context/SocketContext';
import gameRegistry from '../../games/registry';

export default function PlayingScreen({ state, myId, isHost }) {
  const { emit } = useSocket();
  const { currentGame, gameState, players } = state;
  const game = gameRegistry.get(currentGame.id);

  return (
    <div className="min-h-screen flex flex-col items-center p-6">
      <h2 className="text-lg font-semibold text-accent mb-4">{currentGame.name}</h2>
      <div className="w-full max-w-sm">
        {game ? (
          <Suspense fallback={<div className="text-muted-light text-center">Loading...</div>}>
            <game.PhoneComponent
              gameState={gameState}
              myId={myId}
              isHost={isHost}
              players={players}
              emit={emit}
            />
          </Suspense>
        ) : isHost ? (
          <p className="text-muted-light text-center">You're the host</p>
        ) : (
          <p className="text-muted-light text-center">Game in progress</p>
        )}
      </div>
    </div>
  );
}
