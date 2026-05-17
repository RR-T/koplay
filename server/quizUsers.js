let passwords = null;

function load() {
  if (passwords) return passwords;
  const raw = process.env.QUIZ_USERS;
  if (!raw) {
    passwords = {};
    return passwords;
  }
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      passwords = parsed;
    } else {
      console.error('QUIZ_USERS must be a JSON object of {password: username}');
      passwords = {};
    }
  } catch (err) {
    console.error('QUIZ_USERS is not valid JSON:', err.message);
    passwords = {};
  }
  return passwords;
}

function identify(password) {
  if (!password) return null;
  const p = load();
  return Object.prototype.hasOwnProperty.call(p, password) ? p[password] : null;
}

module.exports = { identify };
