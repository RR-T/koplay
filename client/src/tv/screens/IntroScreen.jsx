import { useEffect, useRef } from 'react';

export default function IntroScreen({ onComplete }) {
  const videoRef = useRef(null);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const p = v.play();
    if (p !== undefined) {
      p.catch(() => onComplete());
    }
  }, [onComplete]);

  return (
    <div className="h-screen bg-black flex items-center justify-center">
      <video
        ref={videoRef}
        playsInline
        onEnded={onComplete}
        onError={onComplete}
        className="max-w-full max-h-screen"
      >
        <source src="/koplay.mp4" type="video/mp4" />
      </video>
    </div>
  );
}
