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

// Static files
app.use('/tv', express.static(path.join(__dirname, '..', 'public', 'tv')));
app.use('/phone', express.static(path.join(__dirname, '..', 'public', 'phone')));

// Routes
app.get('/', (req, res) => res.redirect('/phone'));

function broadcastState() {
  io.emit('session:state', session.getPublicState());
}
session.broadcastState = broadcastState;

io.on('connection', (socket) => {
  const role = socket.handshake.query.role;

  if (role === 'tv') {
    socket.join('tv');
    session.reset();
    broadcastState();
  }

  if (role === 'player') {
    socket.emit('session:state', session.getPublicState());

    socket.on('player:join', ({ name }) => {
      if (!name || typeof name !== 'string' || !name.trim()) {
        socket.emit('error', { message: 'Name is required' });
        return;
      }

      const result = session.addPlayer(socket.id, name.trim());
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
      session.reset();
      broadcastState();
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
  console.log(`TV Party Games running on port ${PORT}`);
});
