const ROLE_INTERACTIVE = 1;
const ROLE_GENERATE = 2;
const ROLE_UPLOAD = 4;
const ROLE_ADMIN = 8;

function load() {
  try {
    const raw = process.env.USERS;
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) ? parsed : {};
  } catch (err) {
    console.error('USERS is not valid JSON:', err.message);
    return {};
  }
}

function findByToken(token) {
  if (!token) return null;
  const map = load();
  const entry = map[token];
  if (!entry || typeof entry.name !== 'string') return null;
  return { token, name: entry.name, role: typeof entry.role === 'number' ? entry.role : 0 };
}

function hasRole(user, roleBit) {
  return !!(user && (user.role & roleBit));
}

module.exports = { findByToken, hasRole, ROLE_INTERACTIVE, ROLE_GENERATE, ROLE_UPLOAD, ROLE_ADMIN };
