const SOUNDS = [
  { id: 'sound_00', name: 'Boing Hit' },
  { id: 'sound_01', name: 'Sneeze' },
  { id: 'sound_02', name: 'Clown Nose' },
  { id: 'sound_03', name: 'Monkey' },
  { id: 'sound_04', name: 'Dazzle Birds' },
  { id: 'sound_05', name: 'Failure Piano' },
  { id: 'sound_06', name: 'Fart' },
  { id: 'sound_07', name: 'Friendly Kiss' },
  { id: 'sound_08', name: 'Laugh Voice' },
  { id: 'sound_09', name: 'Quick Splat' },
  { id: 'sound_10', name: 'Sad Horn' },
  { id: 'sound_11', name: 'Strong Fart' },
  { id: 'sound_12', name: 'Toy Whistle' },
  { id: 'sound_13', name: 'Cartoon Laugh' },
  { id: 'sound_14', name: 'Clown Sound' },
  { id: 'sound_15', name: 'Cow Moo' },
  { id: 'sound_16', name: 'Dog Bark' },
  { id: 'sound_17', name: 'Falling Scream' },
  { id: 'sound_18', name: 'Fast Splat' },
  { id: 'sound_19', name: 'Squeaky Toy' },
  { id: 'sound_20', name: 'System Break' },
  { id: 'sound_21', name: 'Horse Snort' },
  { id: 'sound_22', name: 'Hard Pop' },
  { id: 'sound_23', name: 'Kitty Meow' },
  { id: 'sound_24', name: 'Trombone' },
];

// --- Shared AudioContext ---
// Using a single AudioContext lets the browser mix all sounds (SFX + music)
// simultaneously. Samsung Tizen 5 only allows one HTMLAudioElement to play at
// a time, but AudioContext has no such restriction.

let _ctx = null;

function getCtx() {
  if (!_ctx) {
    _ctx = new (window.AudioContext || window.webkitAudioContext)();
  }
  // Tizen may suspend the context; resume it on demand.
  if (_ctx.state === 'suspended') {
    _ctx.resume().catch(() => {});
  }
  return _ctx;
}

// --- SFX buffer cache ---
// Decode each WAV once and reuse the AudioBuffer on subsequent plays.

const _bufferCache = {};

async function loadBuffer(url) {
  if (_bufferCache[url]) return _bufferCache[url];
  const res = await fetch(url);
  const raw = await res.arrayBuffer();
  const buf = await getCtx().decodeAudioData(raw);
  _bufferCache[url] = buf;
  return buf;
}

SOUNDS.forEach((sound) => {
  const url = `/sounds/${sound.id}.wav`;
  // Pre-fetch so the first play is instant.
  loadBuffer(url).catch(() => {});

  sound.play = async () => {
    try {
      const ctx = getCtx();
      const buf = await loadBuffer(url);
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.connect(ctx.destination);
      src.start(0);
    } catch {
      // Silently ignore — same behaviour as before.
    }
  };
});

export function playSoundById(id) {
  const sound = SOUNDS.find((s) => s.id === id);
  if (sound) sound.play();
}

// --- Music helper ---
// Creates an HTMLAudioElement and routes it through the shared AudioContext so
// it mixes with SFX instead of interrupting them (Tizen single-channel limit).
// Usage: const audio = createMusicElement('/tv/lobby.mp3', { loop: true });
//        audio.play().catch(() => {});
//        // later: audio.pause();

export function createMusicElement(url, { loop = false } = {}) {
  const audio = new Audio(url);
  audio.loop = loop;
  try {
    const ctx = getCtx();
    const src = ctx.createMediaElementSource(audio);
    src.connect(ctx.destination);
  } catch {
    // If AudioContext is unavailable, the Audio element still works on its own.
  }
  return audio;
}

export default SOUNDS;
