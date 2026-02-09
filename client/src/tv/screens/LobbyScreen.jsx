import PlayerList from '../../shared/components/PlayerList';
import QRCodeCanvas from '../../shared/components/QRCodeCanvas';

export default function LobbyScreen({ players }) {
  const phoneUrl = window.location.origin + '/phone';

  return (
    <div className="h-screen flex">
      <div className="flex-1 flex flex-col items-center justify-center gap-6 p-8">
        <h1 className="text-4xl font-bold">Lobby</h1>
        <p className="text-lg text-muted-light">Waiting for host to pick a game...</p>
        <PlayerList players={players} className="w-full max-w-md" />
      </div>
      <div className="flex flex-col items-center justify-center gap-3 p-6 bg-surface-light/30">
        <QRCodeCanvas url={phoneUrl} size={160} />
        <p className="text-muted text-xs">Scan to join</p>
      </div>
    </div>
  );
}
