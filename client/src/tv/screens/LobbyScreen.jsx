import PlayerList from '../../shared/components/PlayerList';
import QRCodeCanvas from '../../shared/components/QRCodeCanvas';

export default function LobbyScreen({ players, gameCode }) {
  const joinUrl = gameCode
    ? `${window.location.origin}/?code=${gameCode}`
    : `${window.location.origin}/`;

  return (
    <div className="h-screen flex">
      <div className="flex-1 flex flex-col items-center justify-center gap-8 p-8">
        <h1 className="text-5xl font-bold">Lobby</h1>
        <p className="text-2xl text-muted-light">Waiting for host to pick a game...</p>
        <PlayerList players={players} className="w-full max-w-md" />
      </div>
      <div className="flex flex-col items-center justify-center gap-4 p-6 bg-surface-light/30">
        <QRCodeCanvas url={joinUrl} size={180} />
        <p className="text-muted text-sm">Scan to join</p>
        {gameCode && (
          <p className="font-mono font-bold text-accent tracking-widest text-xl">{gameCode}</p>
        )}
      </div>
    </div>
  );
}
