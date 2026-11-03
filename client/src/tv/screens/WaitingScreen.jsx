import QRCodeCanvas from '../../shared/components/QRCodeCanvas';

export default function WaitingScreen({ gameCode }) {
  const joinUrl = gameCode
    ? `${window.location.origin}/?code=${gameCode}`
    : null;

  return (
    <div className="h-screen flex flex-col items-center justify-center gap-8">
      <img src="/icon.png" alt="KoPlay" className="w-48" />
      <h1 className="text-5xl font-bold">KoPlay</h1>
      {gameCode ? (
        <>
          <p className="text-xl text-muted-light">Scan to join!</p>
          <QRCodeCanvas url={joinUrl} size={280} />
          <div className="flex flex-col items-center gap-2">
            <p className="text-muted text-sm">{joinUrl}</p>
            <p className="text-muted-light text-sm">
              or go to <span className="font-semibold text-white">{window.location.origin}</span> and enter code{' '}
              <span className="font-mono font-bold text-accent text-lg tracking-widest">{gameCode}</span>
            </p>
          </div>
        </>
      ) : (
        <p className="text-muted-light text-xl">Starting...</p>
      )}
    </div>
  );
}
