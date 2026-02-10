import { Suspense } from 'react';
import gameRegistry from '../../games/registry';
import PlayerList from '../../shared/components/PlayerList';

export default function PlayingScreen({ state }) {
  const { currentGame, gameState, players } = state;
  const game = gameRegistry.get(currentGame.id);

  return (
    <div className="h-screen flex flex-col items-center justify-center p-8 overflow-hidden">
      <h1 className="text-4xl font-bold text-accent mb-6">{currentGame.name}</h1>
      <div className="flex-1 flex items-center justify-center w-full">
        {game ? (
          <Suspense fallback={<div className="text-muted-light text-2xl">Loading game...</div>}>
            <game.TVComponent gameState={gameState} players={players} />
          </Suspense>
        ) : (
          <PlayerList players={players} />
        )}
      </div>
    </div>
  );
}
