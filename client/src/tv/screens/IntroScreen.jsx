export default function IntroScreen({ onComplete }) {
  return (
    <div className="h-screen bg-black flex items-center justify-center">
      <video
        autoPlay
        playsInline
        onEnded={onComplete}
        className="max-w-full max-h-screen"
      >
        <source src="/koplay.mp4" type="video/mp4" />
      </video>
    </div>
  );
}
