const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const session = require('./sessionManager');
const games = require('./games');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

// Static files — serve built client from client/dist
const distPath = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(distPath));

// Routes — serve entry HTML for each app (no-cache so Tizen WebView always gets fresh hashes)
const noCacheHeaders = { 'Cache-Control': 'no-cache, no-store, must-revalidate' };
app.get('/tv', (req, res) => {
  res.set(noCacheHeaders);
  res.sendFile(path.join(distPath, 'tv.html'));
});
app.get('/phone', (req, res) => {
  res.set(noCacheHeaders);
  res.sendFile(path.join(distPath, 'phone.html'));
});
app.get('/', (req, res) => res.redirect('/phone'));

function broadcastState() {
  io.emit('session:state', session.getPublicState());
}
session.broadcastState = broadcastState;

let tvSocketId = null;

io.on('connection', (socket) => {
  const role = socket.handshake.query.role;

  if (role === 'tv') {
    if (tvSocketId && io.sockets.sockets.get(tvSocketId)) {
      socket.emit('tv:blocked');
      return;
    }
    tvSocketId = socket.id;
    socket.join('tv');
    session.reset();
    broadcastState();
  }

  if (role === 'player') {
    socket.emit('session:state', session.getPublicState());

    socket.on('player:join', ({ name, avatarId, noiseId }) => {
      if (!name || typeof name !== 'string' || !name.trim()) {
        socket.emit('error', { message: 'Name is required' });
        return;
      }

      const result = session.addPlayer(socket.id, name.trim(), avatarId, noiseId);
      if (result.error) {
        socket.emit('error', { message: result.error });
        return;
      }

      broadcastState();
    });

    socket.on('host:selectGame', ({ gameId }) => {
      if (socket.id !== session.hostId) {
        socket.emit('error', { message: 'Only the host can select a game' });
        return;
      }

      const game = games.get(gameId);
      if (!game) {
        socket.emit('error', { message: 'Unknown game' });
        return;
      }

      session.selectGame(game);
      broadcastState();
    });

    socket.on('game:action', (data) => {
      if (!session.currentGame) return;
      const game = games.get(session.currentGame.id);
      if (game && game.handleAction) {
        game.handleAction(session, socket.id, data);
        broadcastState();
      }
    });
  }

  socket.on('disconnect', () => {
    if (role === 'tv') {
      if (tvSocketId === socket.id) {
        tvSocketId = null;
        session.reset();
        broadcastState();
      }
    }

    if (role === 'player') {
      if (session.currentGame) {
        const game = games.get(session.currentGame.id);
        if (game && game.onPlayerLeave) {
          game.onPlayerLeave(session, socket.id);
        }
      }
      session.removePlayer(socket.id);
      broadcastState();
    }
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`KoPlay is running on port ${PORT}`);
});
