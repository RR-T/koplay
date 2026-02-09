import { Suspense } from 'react';
import gameRegistry from '../../games/registry';
import QRCodeCanvas from '../../shared/components/QRCodeCanvas';
import PlayerList from '../../shared/components/PlayerList';

export default function PlayingScreen({ state }) {
  const phoneUrl = window.location.origin + '/phone';
  const { currentGame, gameState, players } = state;
  const game = gameRegistry.get(currentGame.id);

  return (
    <div className="h-screen flex">
      <div className="flex-1 flex flex-col items-center justify-center p-8 overflow-hidden">
        <h1 className="text-3xl font-bold text-accent mb-4">{currentGame.name}</h1>
        <div className="flex-1 flex items-center justify-center w-full">
          {game ? (
            <Suspense fallback={<div className="text-muted-light text-lg">Loading game...</div>}>
              <game.TVComponent gameState={gameState} players={players} />
            </Suspense>
          ) : (
            <PlayerList players={players} />
          )}
        </div>
      </div>
      <div className="flex flex-col items-center justify-center gap-3 p-6 bg-surface-light/30">
        <QRCodeCanvas url={phoneUrl} size={160} />
        <p className="text-muted text-xs">Scan to join</p>
      </div>
    </div>
  );
}
