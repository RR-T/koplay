const users = require('./users');

function load() {
  try {
    const raw = process.env.SCREENS;
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) ? parsed : {};
  } catch (err) {
    console.error('SCREENS is not valid JSON:', err.message);
    return {};
  }
}

// Local play (LOCAL_MODE) has exactly one screen, at /screen/local, owned by the
// local user, so no SCREENS configuration is needed.
const LOCAL_SCREEN_ID = 'local';

function findByUuid(uuid) {
  if (!uuid) return null;
  if (users.LOCAL_MODE && uuid === LOCAL_SCREEN_ID) {
    return { uuid, label: 'Local screen', owners: [users.localUser().name] };
  }
  const map = load();
  const entry = map[uuid];
  if (!entry || typeof entry.label !== 'string') return null;
  return { uuid, label: entry.label, owners: Array.isArray(entry.owners) ? entry.owners : [] };
}

function isOwner(screen, userName) {
  return screen.owners.includes(userName);
}

module.exports = { findByUuid, isOwner };
