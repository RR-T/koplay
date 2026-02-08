window.GorillasPhone = (() => {
  let currentThrowId = null;

  function getPlayerName(id, players) {
    const p = players.find(pl => pl.id === id);
    return p ? p.name : '?';
  }

  function renderScores(gameState, players) {
    const names = gameState.turnOrder.map(id => getPlayerName(id, players));
    return `<div class="gorillas-scores">` +
      `<span class="score-p1">${names[0]}: ${gameState.scores[0]}</span>` +
      `<span class="score-sep"> - </span>` +
      `<span class="score-p2">${names[1]}: ${gameState.scores[1]}</span>` +
      `</div>`;
  }

  function renderWind(wind) {
    const strength = Math.abs(wind);
    const dir = wind > 0 ? 'right' : wind < 0 ? 'left' : 'none';
    const arrows = dir === 'none' ? '-' :
      (dir === 'right' ? '>' : '<').repeat(Math.ceil(strength * 30));
    return `<div class="gorillas-wind">Wind: ${arrows}</div>`;
  }

  function render(container, gameState, myId, isHost, players, socket) {
    if (!gameState) return;

    if (gameState.phase === 'error') {
      container.innerHTML = `<p class="gorillas-error">${gameState.message}</p>`;
      return;
    }

    const myTurnIndex = gameState.turnOrder.indexOf(myId);
    const isActivePlayer = myTurnIndex !== -1;
    const isMyTurn = isActivePlayer && gameState.currentTurnIndex === myTurnIndex;

    if (gameState.phase === 'gameOver') {
      const winnerName = getPlayerName(gameState.turnOrder[gameState.winner], players);
      container.innerHTML =
        `<div class="gorillas-gameover">` +
          `<div class="gorillas-winner">${winnerName} Wins!</div>` +
          renderScores(gameState, players) +
          (isHost ? `<button class="gorillas-play-again" id="gorillas-play-again">Play Again</button>` : '') +
        `</div>`;

      if (isHost) {
        const btn = document.getElementById('gorillas-play-again');
        btn.addEventListener('click', () => {
          socket.emit('game:action', { type: 'playAgain' });
        });
      }
      currentThrowId = null;
      return;
    }

    if (!isActivePlayer) {
      // Spectator
      container.innerHTML =
        `<div class="gorillas-spectator">` +
          `<p class="gorillas-status">Watching the game</p>` +
          renderScores(gameState, players) +
        `</div>`;
      return;
    }

    if (isMyTurn && gameState.phase === 'aiming') {
      // Check if controls already exist to avoid resetting sliders
      const existingControls = container.querySelector('.gorillas-controls');
      if (existingControls && currentThrowId === gameState.throwId) {
        // Just update wind/scores
        const windEl = container.querySelector('.gorillas-wind');
        if (windEl) windEl.outerHTML = renderWind(gameState.wind);
        const scoresEl = container.querySelector('.gorillas-scores');
        if (scoresEl) scoresEl.outerHTML = renderScores(gameState, players);
        return;
      }

      currentThrowId = gameState.throwId;
      container.innerHTML =
        `<div class="gorillas-controls">` +
          `<div class="gorillas-status">Your turn!</div>` +
          renderScores(gameState, players) +
          renderWind(gameState.wind) +
          `<div class="gorillas-slider-group">` +
            `<label>Angle: <span id="angle-val">45</span>&deg;</label>` +
            `<input type="range" id="gorillas-angle" min="0" max="90" value="45">` +
          `</div>` +
          `<div class="gorillas-slider-group">` +
            `<label>Velocity: <span id="vel-val">50</span></label>` +
            `<input type="range" id="gorillas-velocity" min="1" max="100" value="50">` +
          `</div>` +
          `<button class="gorillas-throw" id="gorillas-throw">THROW!</button>` +
        `</div>`;

      const angleSlider = document.getElementById('gorillas-angle');
      const velSlider = document.getElementById('gorillas-velocity');
      const angleVal = document.getElementById('angle-val');
      const velVal = document.getElementById('vel-val');
      const throwBtn = document.getElementById('gorillas-throw');

      angleSlider.addEventListener('input', () => {
        angleVal.textContent = angleSlider.value;
      });
      velSlider.addEventListener('input', () => {
        velVal.textContent = velSlider.value;
      });

      throwBtn.addEventListener('click', () => {
        throwBtn.disabled = true;
        throwBtn.textContent = 'Throwing...';
        socket.emit('game:action', {
          type: 'throw',
          angle: Number(angleSlider.value),
          velocity: Number(velSlider.value),
        });
      });
    } else {
      // Waiting for opponent
      const currentPlayerName = getPlayerName(
        gameState.turnOrder[gameState.currentTurnIndex], players
      );
      container.innerHTML =
        `<div class="gorillas-waiting">` +
          `<p class="gorillas-status">Waiting for ${currentPlayerName} to throw...</p>` +
          renderScores(gameState, players) +
          renderWind(gameState.wind) +
        `</div>`;
      currentThrowId = null;
    }
  }

  return { render };
})();
