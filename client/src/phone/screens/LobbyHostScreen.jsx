import { useSocket } from '../../shared/context/SocketContext';
import PlayerList from '../../shared/components/PlayerList';
import { availableGames } from '../../games/registry';

export default function LobbyHostScreen({ players }) {
  const { emit, myId } = useSocket();

  return (
    <div className="min-h-screen flex flex-col items-center p-6 gap-6">
      <h1 className="text-2xl font-bold">Pick a Game</h1>
      <div className="w-full max-w-sm flex flex-col gap-3">
        {availableGames.map((game) => (
          <button
            key={game.id}
            className="w-full text-left px-4 py-3 bg-surface-light rounded-lg border border-muted/20 hover:border-accent transition-colors"
            onClick={() => emit('host:selectGame', { gameId: game.id })}
          >
            <strong className="block text-base">{game.name}</strong>
            <span className="text-sm text-muted-light">{game.description}</span>
          </button>
        ))}
      </div>
      <div className="w-full max-w-sm">
        <h2 className="text-lg font-semibold mb-2">Players</h2>
        <PlayerList players={players} myId={myId} />
      </div>
    </div>
  );
}
