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

function findByUuid(uuid) {
  if (!uuid) return null;
  const map = load();
  const entry = map[uuid];
  if (!entry || typeof entry.label !== 'string') return null;
  return { uuid, label: entry.label, owners: Array.isArray(entry.owners) ? entry.owners : [] };
}

function isOwner(screen, userName) {
  return screen.owners.includes(userName);
}

module.exports = { findByUuid, isOwner };
