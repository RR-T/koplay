class SessionManager {
  constructor() {
    this.reset();
  }

  reset() {
    this.state = 'waiting';
    this.hostId = null;
    this.players = new Map();
    this.currentGame = null;
    this.gameState = null;
  }

  addPlayer(id, name) {
    if (this.players.has(id)) {
      return { error: 'Already joined' };
    }

    for (const [, player] of this.players) {
      if (player.name.toLowerCase() === name.toLowerCase()) {
        return { error: 'Name already taken' };
      }
    }

    this.players.set(id, { name });

    if (!this.hostId) {
      this.hostId = id;
      this.state = 'lobby';
    }

    return { ok: true };
  }

  removePlayer(id) {
    this.players.delete(id);

    if (id === this.hostId) {
      const nextPlayer = this.players.keys().next().value;
      this.hostId = nextPlayer || null;
    }

    if (this.players.size === 0) {
      this.state = 'waiting';
      this.hostId = null;
      this.currentGame = null;
      this.gameState = null;
    }
  }

  selectGame(gameModule) {
    this.currentGame = { id: gameModule.id, name: gameModule.name };
    this.state = 'playing';
    this.gameState = gameModule.init(this);
  }

  getPublicState() {
    const players = [];
    for (const [id, player] of this.players) {
      players.push({ id, name: player.name, isHost: id === this.hostId });
    }

    return {
      state: this.state,
      hostId: this.hostId,
      players,
      currentGame: this.currentGame,
      gameState: this.gameState,
    };
  }
}

module.exports = new SessionManager();
