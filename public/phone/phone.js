const socket = io({ query: { role: 'player' } });

let myId = null;
let joined = false;

const screens = {
  join: document.getElementById('screen-join'),
  waiting: document.getElementById('screen-waiting'),
  lobbyHost: document.getElementById('screen-lobby-host'),
  lobbyPlayer: document.getElementById('screen-lobby-player'),
  playing: document.getElementById('screen-playing'),
};

const joinForm = document.getElementById('join-form');
const nameInput = document.getElementById('name-input');
const joinError = document.getElementById('join-error');

socket.on('connect', () => {
  myId = socket.id;
});

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
    if (p.id === myId) {
      li.classList.add('me');
    }
    container.appendChild(li);
  }
}

function renderGameList(games) {
  const container = document.getElementById('game-list');
  container.innerHTML = '';
  for (const game of games) {
    const btn = document.createElement('button');
    btn.className = 'game-btn';
    btn.innerHTML = `<strong>${game.name}</strong><span>${game.description}</span>`;
    btn.addEventListener('click', () => {
      socket.emit('host:selectGame', { gameId: game.id });
    });
    container.appendChild(btn);
  }
}

joinForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const name = nameInput.value.trim();
  if (!name) return;

  joinError.classList.add('hidden');
  socket.emit('player:join', { name });
  joined = true;
});

socket.on('error', (data) => {
  joinError.textContent = data.message;
  joinError.classList.remove('hidden');
  joined = false;
});

// Available games (fetched from state or hardcoded for now — the server could provide this)
const availableGames = [
  { id: 'lobby', name: 'Lobby', description: 'Chill in the lobby' },
  { id: 'gorillas', name: 'Gorillas', description: 'Throw bananas across the skyline!' },
  { id: 'acrophobia', name: 'Acrophobia', description: 'Make up funny acronyms and vote for the best!' },
  { id: 'trivia', name: 'Trivia', description: 'Answer questions across 3 rounds — easy, medium, hard!' },
];

socket.on('session:state', (state) => {
  const amHost = myId === state.hostId;
  const amPlayer = state.players.some((p) => p.id === myId);

  if (state.state === 'waiting') {
    if (joined && !amPlayer) {
      // Session was reset (TV disconnected), show join screen again
      joined = false;
    }
    showScreen(joined ? 'waiting' : 'join');
    return;
  }

  if (!amPlayer) {
    showScreen('join');
    return;
  }

  if (state.state === 'lobby') {
    if (amHost) {
      showScreen('lobbyHost');
      renderGameList(availableGames);
      renderPlayerList(document.getElementById('host-players'), state.players);
    } else {
      showScreen('lobbyPlayer');
      renderPlayerList(document.getElementById('player-players'), state.players);
    }
  } else if (state.state === 'playing') {
    showScreen('playing');
    document.getElementById('playing-game-name').textContent = state.currentGame.name;
    renderPlayerList(document.getElementById('playing-players'), state.players);

    const content = document.getElementById('playing-content');
    if (state.currentGame.id === 'gorillas') {
      GorillasPhone.render(content, state.gameState, myId, amHost, state.players, socket);
    } else if (state.currentGame.id === 'acrophobia') {
      AcrophobiaPhone.render(content, state.gameState, myId, amHost, state.players, socket);
    } else if (state.currentGame.id === 'trivia') {
      TriviaPhone.render(content, state.gameState, myId, amHost, state.players, socket);
    } else if (amHost) {
      content.innerHTML = '<p class="info">You\'re the host</p>';
    } else {
      content.innerHTML = '<p class="info">Game in progress</p>';
    }
  }
});
