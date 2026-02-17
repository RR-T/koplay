import { useSocket } from '../../shared/context/SocketContext';
import PlayerList from '../../shared/components/PlayerList';

export default function LobbyPlayerScreen({ players }) {
  const { myId } = useSocket();

  return (
    <div className="min-h-screen flex flex-col items-center p-6 gap-6">
      <h1 className="text-2xl font-bold">Lobby</h1>
      <p className="text-muted-light">Game has not started yet</p>
      <div className="w-full max-w-sm">
        <h2 className="text-lg font-semibold mb-2">Players</h2>
        <PlayerList players={players} myId={myId} />
      </div>
    </div>
  );
}
