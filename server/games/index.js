const lobby = require('./lobby');
const gorillas = require('./gorillas');
const acrophobia = require('./acrophobia');

const games = new Map();
games.set(lobby.id, lobby);
games.set(gorillas.id, gorillas);
games.set(acrophobia.id, acrophobia);

module.exports = games;
