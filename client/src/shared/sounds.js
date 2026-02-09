// 12 distinct Web Audio API generated sounds
// Lazy-init shared AudioContext

let ctx = null;

function getCtx() {
  if (!ctx) ctx = new AudioContext();
  return ctx;
}

async function ensureResumed() {
  const c = getCtx();
  if (c.state === 'suspended') await c.resume();
  return c;
}

function makeSound(name, fn) {
  return { id: name, name, play: fn };
}

const SOUNDS = [
  makeSound('Honk', async () => {
    const c = await ensureResumed();
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, c.currentTime);
    osc.frequency.linearRampToValueAtTime(150, c.currentTime + 0.3);
    gain.gain.setValueAtTime(0.3, c.currentTime);
    gain.gain.linearRampToValueAtTime(0, c.currentTime + 0.3);
    osc.connect(gain).connect(c.destination);
    osc.start(); osc.stop(c.currentTime + 0.3);
  }),
  makeSound('Boing', async () => {
    const c = await ensureResumed();
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, c.currentTime);
    osc.frequency.exponentialRampToValueAtTime(600, c.currentTime + 0.15);
    osc.frequency.exponentialRampToValueAtTime(200, c.currentTime + 0.3);
    gain.gain.setValueAtTime(0.3, c.currentTime);
    gain.gain.linearRampToValueAtTime(0, c.currentTime + 0.4);
    osc.connect(gain).connect(c.destination);
    osc.start(); osc.stop(c.currentTime + 0.4);
  }),
  makeSound('Ding', async () => {
    const c = await ensureResumed();
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, c.currentTime);
    gain.gain.setValueAtTime(0.3, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.5);
    osc.connect(gain).connect(c.destination);
    osc.start(); osc.stop(c.currentTime + 0.5);
  }),
  makeSound('Buzz', async () => {
    const c = await ensureResumed();
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(120, c.currentTime);
    gain.gain.setValueAtTime(0.2, c.currentTime);
    gain.gain.linearRampToValueAtTime(0, c.currentTime + 0.25);
    osc.connect(gain).connect(c.destination);
    osc.start(); osc.stop(c.currentTime + 0.25);
  }),
  makeSound('Pop', async () => {
    const c = await ensureResumed();
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, c.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, c.currentTime + 0.15);
    gain.gain.setValueAtTime(0.4, c.currentTime);
    gain.gain.linearRampToValueAtTime(0, c.currentTime + 0.15);
    osc.connect(gain).connect(c.destination);
    osc.start(); osc.stop(c.currentTime + 0.15);
  }),
  makeSound('Zap', async () => {
    const c = await ensureResumed();
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(1200, c.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, c.currentTime + 0.2);
    gain.gain.setValueAtTime(0.2, c.currentTime);
    gain.gain.linearRampToValueAtTime(0, c.currentTime + 0.2);
    osc.connect(gain).connect(c.destination);
    osc.start(); osc.stop(c.currentTime + 0.2);
  }),
  makeSound('Chirp', async () => {
    const c = await ensureResumed();
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, c.currentTime);
    osc.frequency.linearRampToValueAtTime(1200, c.currentTime + 0.1);
    osc.frequency.linearRampToValueAtTime(800, c.currentTime + 0.2);
    gain.gain.setValueAtTime(0.3, c.currentTime);
    gain.gain.linearRampToValueAtTime(0, c.currentTime + 0.25);
    osc.connect(gain).connect(c.destination);
    osc.start(); osc.stop(c.currentTime + 0.25);
  }),
  makeSound('Whomp', async () => {
    const c = await ensureResumed();
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, c.currentTime);
    osc.frequency.exponentialRampToValueAtTime(50, c.currentTime + 0.4);
    gain.gain.setValueAtTime(0.4, c.currentTime);
    gain.gain.linearRampToValueAtTime(0, c.currentTime + 0.4);
    osc.connect(gain).connect(c.destination);
    osc.start(); osc.stop(c.currentTime + 0.4);
  }),
  makeSound('Blip', async () => {
    const c = await ensureResumed();
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(800, c.currentTime);
    osc.frequency.setValueAtTime(1000, c.currentTime + 0.05);
    osc.frequency.setValueAtTime(800, c.currentTime + 0.1);
    gain.gain.setValueAtTime(0.15, c.currentTime);
    gain.gain.linearRampToValueAtTime(0, c.currentTime + 0.15);
    osc.connect(gain).connect(c.destination);
    osc.start(); osc.stop(c.currentTime + 0.15);
  }),
  makeSound('Siren', async () => {
    const c = await ensureResumed();
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, c.currentTime);
    osc.frequency.linearRampToValueAtTime(800, c.currentTime + 0.2);
    osc.frequency.linearRampToValueAtTime(400, c.currentTime + 0.4);
    gain.gain.setValueAtTime(0.25, c.currentTime);
    gain.gain.linearRampToValueAtTime(0, c.currentTime + 0.4);
    osc.connect(gain).connect(c.destination);
    osc.start(); osc.stop(c.currentTime + 0.4);
  }),
  makeSound('Drum', async () => {
    const c = await ensureResumed();
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(200, c.currentTime);
    osc.frequency.exponentialRampToValueAtTime(50, c.currentTime + 0.1);
    gain.gain.setValueAtTime(0.5, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.2);
    osc.connect(gain).connect(c.destination);
    osc.start(); osc.stop(c.currentTime + 0.2);
  }),
  makeSound('Twang', async () => {
    const c = await ensureResumed();
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(300, c.currentTime);
    osc.frequency.exponentialRampToValueAtTime(150, c.currentTime + 0.3);
    gain.gain.setValueAtTime(0.3, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.4);
    osc.connect(gain).connect(c.destination);
    osc.start(); osc.stop(c.currentTime + 0.4);
  }),
];

export function playSoundById(id) {
  const sound = SOUNDS.find((s) => s.id === id);
  if (sound) sound.play();
}

export default SOUNDS;
