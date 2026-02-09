import QRCodeCanvas from '../../shared/components/QRCodeCanvas';

export default function WaitingScreen() {
  const phoneUrl = window.location.origin + '/phone';

  return (
    <div className="h-screen flex flex-col items-center justify-center gap-8">
      <img src="/icon.png" alt="KoPlay" className="w-48" />
      <h1 className="text-5xl font-bold">KoPlay</h1>
      <p className="text-xl text-muted-light">Scan to join!</p>
      <QRCodeCanvas url={phoneUrl} size={280} />
      <p className="text-muted text-sm">{phoneUrl}</p>
    </div>
  );
}
