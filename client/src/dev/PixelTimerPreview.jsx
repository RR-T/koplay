import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { PixelCountdown, PixelTimer } from '../shared/components/PixelTimer';
import '../index.css';

const ACCENTS = {
  A: { accent: '#dc2626', shadow: '#580f0f' },
  B: { accent: '#2563eb', shadow: '#0f2c5e' },
  C: { accent: '#f59e0b', shadow: '#623f04' },
  D: { accent: '#0d9488', shadow: '#053b36' },
};

function Preview() {
  const [duration, setDuration] = useState(15);
  const [running, setRunning] = useState(true);
  const [tick, setTick] = useState(true);
  const [lowAt, setLowAt] = useState(5);
  const [letter, setLetter] = useState('B');
  const [size, setSize] = useState('240px');
  const [manualProgress, setManualProgress] = useState(0.35);
  const [manualLow, setManualLow] = useState(false);
  const [runKey, setRunKey] = useState(0);
  const [doneCount, setDoneCount] = useState(0);

  const colours = ACCENTS[letter];
  const dialStyle = {
    '--pt-size': size,
    '--pt-accent': colours.accent,
    '--pt-shadow': colours.shadow,
  };

  return (
    <div
      className="min-h-screen text-white"
      style={{
        background: '#0d1020 url(/tv/background.jpg) center / cover',
        padding: 24,
      }}
    >
      <div
        className="bg-black/80"
        style={{ padding: '12px 14px', marginBottom: 20, maxWidth: 960 }}
      >
        <p className="font-bold" style={{ marginBottom: 10 }}>Pixel timer preview</p>
        <div className="flex flex-wrap items-center" style={{ rowGap: 8 }}>
          <label style={{ marginRight: 12 }}>
            Letter
            <select
              value={letter}
              onChange={(e) => setLetter(e.target.value)}
              style={{ marginLeft: 6, color: '#000' }}
            >
              {Object.keys(ACCENTS).map((k) => (
                <option key={k} value={k}>{k}</option>
              ))}
            </select>
          </label>
          <label style={{ marginRight: 12 }}>
            Duration
            <input
              type="number"
              min={3}
              max={120}
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value) || 15)}
              style={{ width: 56, marginLeft: 6, color: '#000' }}
            />
          </label>
          <label style={{ marginRight: 12 }}>
            lowAt
            <input
              type="number"
              min={1}
              max={30}
              value={lowAt}
              onChange={(e) => setLowAt(Number(e.target.value) || 5)}
              style={{ width: 48, marginLeft: 6, color: '#000' }}
            />
          </label>
          <label style={{ marginRight: 12 }}>
            Size
            <select
              value={size}
              onChange={(e) => setSize(e.target.value)}
              style={{ marginLeft: 6, color: '#000' }}
            >
              <option value="160px">160px</option>
              <option value="240px">240px</option>
              <option value="320px">320px</option>
              <option value="400px">400px</option>
              <option value="20vh">20vh</option>
            </select>
          </label>
          <label className="flex items-center" style={{ marginRight: 12 }}>
            <input
              type="checkbox"
              checked={tick}
              onChange={(e) => setTick(e.target.checked)}
              style={{ marginRight: 4 }}
            />
            tick (1s jumps)
          </label>
          <label className="flex items-center" style={{ marginRight: 12 }}>
            <input
              type="checkbox"
              checked={running}
              onChange={(e) => setRunning(e.target.checked)}
              style={{ marginRight: 4 }}
            />
            running
          </label>
          <button
            type="button"
            className="bg-accent text-white font-semibold"
            style={{ padding: '4px 10px', border: 'none', cursor: 'pointer', marginRight: 8 }}
            onClick={() => {
              setRunning(true);
              setRunKey((k) => k + 1);
            }}
          >
            Restart countdown
          </button>
          <span style={{ opacity: 0.7 }}>completed ×{doneCount}</span>
        </div>
      </div>

      <div className="flex flex-wrap" style={{ gap: 48 }}>
        <div>
          <p className="font-semibold" style={{ marginBottom: 12 }}>Self-timing (PixelCountdown)</p>
          <div
            className="relative bg-black/40"
            style={{ padding: 24, minWidth: 280, minHeight: 280 }}
          >
            <p className="text-white/70 text-sm" style={{ marginBottom: 8 }}>
              Corner placement mock (question phase)
            </p>
            <PixelCountdown
              key={runKey}
              duration={duration}
              running={running}
              tick={tick}
              lowAt={lowAt}
              style={dialStyle}
              onComplete={() => setDoneCount((n) => n + 1)}
            />
          </div>
        </div>

        <div>
          <p className="font-semibold" style={{ marginBottom: 12 }}>
            Driven (PixelTimer) - progress {Math.round(manualProgress * 100)}%
          </p>
          <label className="flex items-center" style={{ marginBottom: 12 }}>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(manualProgress * 100)}
              onChange={(e) => setManualProgress(Number(e.target.value) / 100)}
              style={{ width: 200, marginRight: 12 }}
            />
            <input
              type="checkbox"
              checked={manualLow}
              onChange={(e) => setManualLow(e.target.checked)}
              style={{ marginRight: 4 }}
            />
            force low (red blink)
          </label>
          <PixelTimer
            progress={manualProgress}
            low={manualLow}
            style={dialStyle}
          />
        </div>
      </div>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<Preview />);
