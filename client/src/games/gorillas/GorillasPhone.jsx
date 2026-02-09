import { useState, useRef, useEffect } from 'react';
import PlayAgainButton from '../../shared/components/PlayAgainButton';

function getPlayerName(id, players) {
  const p = players.find(pl => pl.id === id);
  return p ? p.name : '?';
}

function Scores({ gameState, players }) {
  const names = gameState.turnOrder.map(id => getPlayerName(id, players));
  return (
    <div className="flex justify-center gap-3 text-lg font-bold">
      <span className="text-p1-orange">{names[0]}: {gameState.scores[0]}</span>
      <span className="text-muted">-</span>
      <span className="text-p2-blue">{names[1]}: {gameState.scores[1]}</span>
    </div>
  );
}

function Wind({ wind }) {
  const strength = Math.abs(wind);
  const dir = wind > 0 ? 'right' : wind < 0 ? 'left' : 'none';
  const arrows = dir === 'none' ? '-' :
    (dir === 'right' ? '>' : '<').repeat(Math.ceil(strength * 30));
  return <div className="text-center text-muted-light">Wind: {arrows}</div>;
}

export default function GorillasPhone({ gameState, myId, isHost, players, emit }) {
  const [angle, setAngle] = useState(45);
  const [velocity, setVelocity] = useState(50);
  const [throwing, setThrowing] = useState(false);
  const prevThrowIdRef = useRef(null);

  if (!gameState) return null;

  const myTurnIndex = gameState.turnOrder.indexOf(myId);
  const isActivePlayer = myTurnIndex !== -1;
  const isMyTurn = isActivePlayer && gameState.currentTurnIndex === myTurnIndex;

  // Reset throwing state when throwId changes
  if (gameState.throwId !== prevThrowIdRef.current) {
    prevThrowIdRef.current = gameState.throwId;
    if (throwing) setThrowing(false);
  }

  if (gameState.phase === 'error') {
    return <p className="text-error text-center">{gameState.message}</p>;
  }

  if (gameState.phase === 'gameOver') {
    const winnerName = getPlayerName(gameState.turnOrder[gameState.winner], players);
    return (
      <div className="flex flex-col items-center gap-4">
        <div className="text-2xl font-bold text-accent">{winnerName} Wins!</div>
        <Scores gameState={gameState} players={players} />
        {isHost && <PlayAgainButton />}
      </div>
    );
  }

  if (!isActivePlayer) {
    return (
      <div className="flex flex-col items-center gap-4">
        <p className="text-muted-light">Watching the game</p>
        <Scores gameState={gameState} players={players} />
      </div>
    );
  }

  if (isMyTurn && gameState.phase === 'aiming') {
    function handleThrow() {
      setThrowing(true);
      emit('game:action', { type: 'throw', angle, velocity });
    }

    return (
      <div className="flex flex-col gap-4">
        <div className="text-center text-lg font-semibold text-teal">Your turn!</div>
        <Scores gameState={gameState} players={players} />
        <Wind wind={gameState.wind} />

        <div className="flex flex-col gap-1">
          <label className="text-sm text-muted-light">Angle: {angle}&deg;</label>
          <input
            type="range"
            min="0"
            max="90"
            value={angle}
            onChange={(e) => setAngle(Number(e.target.value))}
            className="w-full accent-accent"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm text-muted-light">Velocity: {velocity}</label>
          <input
            type="range"
            min="1"
            max="100"
            value={velocity}
            onChange={(e) => setVelocity(Number(e.target.value))}
            className="w-full accent-accent"
          />
        </div>

        <button
          onClick={handleThrow}
          disabled={throwing}
          className="w-full py-3 bg-accent hover:bg-accent-hover disabled:bg-muted text-white text-lg font-bold rounded-lg transition-colors"
        >
          {throwing ? 'Throwing...' : 'THROW!'}
        </button>
      </div>
    );
  }

  // Waiting for opponent
  const currentPlayerName = getPlayerName(
    gameState.turnOrder[gameState.currentTurnIndex], players
  );
  return (
    <div className="flex flex-col items-center gap-4">
      <p className="text-muted-light">Waiting for {currentPlayerName} to throw...</p>
      <Scores gameState={gameState} players={players} />
      <Wind wind={gameState.wind} />
    </div>
  );
}
