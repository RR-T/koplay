const lobby = require('./lobby');
const gorillas = require('./gorillas');

const games = new Map();
games.set(lobby.id, lobby);
games.set(gorillas.id, gorillas);

module.exports = games;
