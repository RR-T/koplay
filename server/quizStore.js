const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_DIR = path.join(__dirname, 'data');
const FILE = path.join(DATA_DIR, 'quizzes.json');

let cache = null;

function ensureLoaded() {
  if (cache) return cache;
  try {
    const raw = fs.readFileSync(FILE, 'utf8');
    const parsed = JSON.parse(raw);
    cache = Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    if (err.code !== 'ENOENT') console.error('quizStore: failed to read', err.message);
    cache = [];
  }
  return cache;
}

function writeAtomic(quizzes) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const tmp = FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(quizzes, null, 2));
  fs.renameSync(tmp, FILE);
}

function summaries() {
  return ensureLoaded()
    .map(({ id, topic, creator, createdAt }) => ({ id, topic, creator, createdAt }))
    .sort((a, b) => b.createdAt - a.createdAt);
}

function get(id) {
  return ensureLoaded().find((q) => q.id === id) || null;
}

function normalizeIp(ip) {
  if (!ip) return null;
  return ip.startsWith('::ffff:') ? ip.slice(7) : ip;
}

const MAX_IMAGE_WIDTH = 1280;

// Wikimedia URLs without a width param serve the full-resolution original
// (often 50MB+), which the Tizen TV cannot download or decode — rewrite them
// to the cached thumbnail endpoint. Widths above the original are clamped.
function normalizeImageUrl(url) {
  if (!url) return url;
  const filePath = url.match(/^https?:\/\/commons\.(?:m\.)?wikimedia\.org\/wiki\/Special:FilePath\/[^?]+/i);
  if (filePath) {
    return /[?&]width=\d/i.test(url) ? url : `${filePath[0]}?width=${MAX_IMAGE_WIDTH}`;
  }
  const original = url.match(/^https?:\/\/upload\.wikimedia\.org\/wikipedia\/commons\/[0-9a-f]\/[0-9a-f]{2}\/([^/?]+)$/i);
  if (original) {
    return `https://commons.wikimedia.org/wiki/Special:FilePath/${original[1]}?width=${MAX_IMAGE_WIDTH}`;
  }
  return url;
}

function save({ topic, rounds, creator, ip }) {
  for (const round of rounds) {
    for (const q of round.questions) {
      if (q.image) q.image = normalizeImageUrl(q.image);
    }
  }
  const quiz = {
    id: crypto.randomUUID(),
    topic,
    creator,
    creatorIp: normalizeIp(ip) || null,
    createdAt: Date.now(),
    rounds,
  };
  const quizzes = ensureLoaded();
  quizzes.push(quiz);
  writeAtomic(quizzes);
  return quiz;
}

function remove(id, requester) {
  const quizzes = ensureLoaded();
  const idx = quizzes.findIndex((q) => q.id === id);
  if (idx === -1) return { error: 'Quiz not found' };
  if (requester !== null && quizzes[idx].creator !== requester) return { error: 'Only the creator can delete this quiz' };
  quizzes.splice(idx, 1);
  writeAtomic(quizzes);
  return { ok: true };
}

module.exports = { summaries, get, save, remove, normalizeImageUrl };
