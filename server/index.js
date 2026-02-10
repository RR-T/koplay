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

// Routes — serve entry HTML for each app
app.get('/tv', (req, res) => res.sendFile(path.join(distPath, 'tv.html')));
app.get('/phone', (req, res) => res.sendFile(path.join(distPath, 'phone.html')));
app.get('/', (req, res) => res.redirect('/phone'));

// Temporary diagnostic page for TV browser testing
app.get('/tv-test', (req, res) => {
  res.send(`<!DOCTYPE html><html><body style="background:#1a1a2e;color:#eee;font-family:sans-serif;padding:2em">
<h1>TV Browser Diagnostics</h1>
<p id="ua"></p>
<p id="mod"></p>
<script>document.getElementById('ua').textContent='UA: '+navigator.userAgent;</script>
<script type="module">document.getElementById('mod').textContent='ES Modules: SUPPORTED';</script>
<script nomodule>document.getElementById('mod').textContent='ES Modules: NOT SUPPORTED';</script>
</body></html>`);
});

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
  console.log(`KoPlay is running on port ${PORT}`);
});
