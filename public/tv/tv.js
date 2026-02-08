const socket = io({ query: { role: 'tv' } });

const screens = {
  waiting: document.getElementById('screen-waiting'),
  lobby: document.getElementById('screen-lobby'),
  playing: document.getElementById('screen-playing'),
};

const phoneUrl = window.location.origin + '/phone';
let qrGenerated = false;

function generateQRCodes() {
  if (qrGenerated) return;
  qrGenerated = true;

  const opts = { width: 280, margin: 2, color: { dark: '#000', light: '#fff' } };
  const smallOpts = { width: 160, margin: 2, color: { dark: '#000', light: '#fff' } };

  QRCode.toCanvas(phoneUrl, opts, (err, canvas) => {
    if (!err) document.getElementById('qr-waiting').appendChild(canvas);
  });

  QRCode.toCanvas(phoneUrl, smallOpts, (err, canvas) => {
    if (!err) document.getElementById('qr-lobby').appendChild(canvas);
  });

  QRCode.toCanvas(phoneUrl, smallOpts, (err, canvas) => {
    if (!err) document.getElementById('qr-playing').appendChild(canvas);
  });
}

function showScreen(name) {
  for (const [key, el] of Object.entries(screens)) {
    el.classList.toggle('hidden', key !== name);
  }
}

function renderPlayerList(container, players) {
  container.innerHTML = '';
  for (const p of players) {
    const li = document.createElement('li');
    li.textContent = p.name;
    if (p.isHost) {
      const badge = document.createElement('span');
      badge.className = 'host-badge';
      badge.textContent = 'HOST';
      li.appendChild(badge);
    }
    container.appendChild(li);
  }
}

socket.on('session:state', (state) => {
  generateQRCodes();

  if (state.state === 'waiting') {
    showScreen('waiting');
  } else if (state.state === 'lobby') {
    showScreen('lobby');
    renderPlayerList(document.getElementById('lobby-players'), state.players);
  } else if (state.state === 'playing') {
    showScreen('playing');
    document.getElementById('game-title').textContent = state.currentGame.name;

    const display = document.getElementById('game-display');
    if (state.currentGame.id === 'gorillas') {
      GorillasTV.render(display, state.gameState, state.players);
    } else if (state.currentGame.id === 'acrophobia') {
      AcrophobiaTV.render(display, state.gameState, state.players);
    } else {
      const list = document.createElement('ul');
      list.className = 'player-list';
      renderPlayerList(list, state.players);
      display.innerHTML = '';
      display.appendChild(list);
    }
  }
});
