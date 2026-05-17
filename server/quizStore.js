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

function save({ topic, rounds, creator }) {
  const quiz = {
    id: crypto.randomUUID(),
    topic,
    creator,
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
  if (quizzes[idx].creator !== requester) return { error: 'Only the creator can delete this quiz' };
  quizzes.splice(idx, 1);
  writeAtomic(quizzes);
  return { ok: true };
}

module.exports = { summaries, get, save, remove };
