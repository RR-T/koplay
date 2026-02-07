const lobby = require('./lobby');

const games = new Map();
games.set(lobby.id, lobby);

module.exports = games;
