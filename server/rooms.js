const SessionManager = require('./sessionManager');

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generateCode() {
  let code = '';
  for (let i = 0; i < 5; i++) {
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return code;
}

class RoomRegistry {
  constructor() {
    this.rooms = new Map(); // uuid -> { session, gameCode }
    this.codes = new Map(); // gameCode -> room
    this.quizRooms = new Map(); // quizId -> room
  }

  getOrCreate(uuid) {
    if (this.rooms.has(uuid)) return this.rooms.get(uuid);
    return this._create(uuid);
  }

  getOrCreateByQuizId(quizId) {
    if (this.quizRooms.has(quizId)) return this.quizRooms.get(quizId);
    const gameCode = this._uniqueCode();
    const session = new SessionManager();
    const room = { session, gameCode };
    this.quizRooms.set(quizId, room);
    this.codes.set(gameCode, room);
    return room;
  }

  _create(uuid) {
    const gameCode = this._uniqueCode();
    const session = new SessionManager();
    const room = { session, gameCode };
    this.rooms.set(uuid, room);
    this.codes.set(gameCode, room);
    return room;
  }

  _uniqueCode() {
    let code;
    do { code = generateCode(); } while (this.codes.has(code));
    return code;
  }

  getByCode(code) {
    return this.codes.get(code) || null;
  }

  getByUuid(uuid) {
    return this.rooms.get(uuid) || null;
  }

  setBroadcast(broadcastFn) {
    this._broadcast = broadcastFn;
  }

  attachBroadcast(room) {
    const registry = this;
    room.session.broadcastState = function () {
      if (registry._broadcast) registry._broadcast(room.gameCode);
    };
  }
}

module.exports = new RoomRegistry();
