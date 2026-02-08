window.TriviaPhone = (() => {
  let timerInterval = null;
  let confettiAnim = null;
  let localState = { answered: false, lastQuestion: 0, lastRound: 0 };

  function clearTimerInterval() {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  }

  function stopConfetti() {
    if (confettiAnim) {
      cancelAnimationFrame(confettiAnim);
      confettiAnim = null;
    }
  }

  function startConfetti(canvas) {
    stopConfetti();
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.parentElement.offsetWidth;
    canvas.height = canvas.parentElement.offsetHeight;

    const colors = ['#e94560', '#4ecdc4', '#ffc048', '#4a9eff', '#ff6b6b', '#a855f7'];
    const pieces = [];

    for (let i = 0; i < 60; i++) {
      pieces.push({
        x: Math.random() * canvas.width,
        y: Math.random() * -canvas.height,
        w: Math.random() * 6 + 3,
        h: Math.random() * 4 + 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        vx: (Math.random() - 0.5) * 2,
        vy: Math.random() * 2.5 + 1.5,
        rot: Math.random() * Math.PI * 2,
        rv: (Math.random() - 0.5) * 0.15,
      });
    }

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;

      for (const p of pieces) {
        p.x += p.vx;
        p.vy += 0.03;
        p.y += p.vy;
        p.rot += p.rv;

        if (p.y < canvas.height + 20) alive = true;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }

      if (alive) {
        confettiAnim = requestAnimationFrame(draw);
      } else {
        confettiAnim = null;
      }
    }

    confettiAnim = requestAnimationFrame(draw);
  }

  function formatTime(ms) {
    const secs = Math.max(0, Math.ceil(ms / 1000));
    return secs + 's';
  }

  function startTimerDisplay(el, endsAt) {
    clearTimerInterval();
    function update() {
      const remaining = endsAt - Date.now();
      el.textContent = formatTime(remaining);
      if (remaining <= 0) clearTimerInterval();
    }
    update();
    timerInterval = setInterval(update, 250);
  }

  function esc(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  const CHOICE_LABELS = ['A', 'B', 'C', 'D'];

  function render(container, gs, myId, amHost, players, socket) {
    clearTimerInterval();
    if (gs.phase !== 'gameover') stopConfetti();

    // Reset local flags on new question
    if (gs.round !== localState.lastRound || gs.questionNum !== localState.lastQuestion) {
      localState.answered = false;
      localState.lastRound = gs.round;
      localState.lastQuestion = gs.questionNum;
    }

    if (gs.phase === 'error') {
      container.innerHTML = `<p class="trivia-phone-error">${esc(gs.message)}</p>`;
      return;
    }

    if (gs.phase === 'question') {
      if (localState.answered) {
        container.innerHTML = `
          <div class="trivia-phone-waiting">
            <div class="trivia-phone-round">${esc(gs.roundName)} — Q${gs.questionNum}/${gs.totalQuestions}</div>
            <div class="trivia-phone-timer" id="trivia-phone-timer"></div>
            <p class="trivia-phone-status">Answer locked in!</p>
            <div class="trivia-phone-progress">${gs.answeredCount} / ${gs.totalPlayers} answered</div>
          </div>`;
        if (gs.timer) {
          startTimerDisplay(document.getElementById('trivia-phone-timer'), gs.timer.endsAt);
        }
        return;
      }

      let buttonsHtml = '';
      for (let i = 0; i < gs.choices.length; i++) {
        buttonsHtml += `<button class="trivia-phone-answer-btn" data-index="${i}">${CHOICE_LABELS[i]}</button>`;
      }

      container.innerHTML = `
        <div class="trivia-phone-question">
          <div class="trivia-phone-round">${esc(gs.roundName)} — Q${gs.questionNum}/${gs.totalQuestions}</div>
          <div class="trivia-phone-timer" id="trivia-phone-timer"></div>
          <p class="trivia-phone-prompt">Pick your answer!</p>
          <div class="trivia-phone-answers">${buttonsHtml}</div>
          <div class="trivia-phone-progress">${gs.answeredCount} / ${gs.totalPlayers} answered</div>
        </div>`;

      container.querySelectorAll('.trivia-phone-answer-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          const index = parseInt(btn.dataset.index);
          socket.emit('game:action', { type: 'answer', index });
          localState.answered = true;
          render(container, gs, myId, amHost, players, socket);
        });
      });

      if (gs.timer) {
        startTimerDisplay(document.getElementById('trivia-phone-timer'), gs.timer.endsAt);
      }
      return;
    }

    if (gs.phase === 'reveal') {
      const me = gs.playerResults ? gs.playerResults.find((r) => {
        // Match by checking players array for our name
        const myPlayer = players.find((p) => p.id === myId);
        return myPlayer && r.name === myPlayer.name;
      }) : null;

      let resultText = '';
      if (me) {
        resultText = me.correct
          ? '<p class="trivia-phone-result trivia-phone-correct">Correct!</p>'
          : '<p class="trivia-phone-result trivia-phone-incorrect">Wrong!</p>';
      }

      container.innerHTML = `
        <div class="trivia-phone-reveal">
          <div class="trivia-phone-round">${esc(gs.roundName)} — Q${gs.questionNum}/${gs.totalQuestions}</div>
          ${resultText}
          <p class="trivia-phone-score">Your score: ${gs.scores[myId] || 0}</p>
        </div>`;
      return;
    }

    if (gs.phase === 'roundEnd') {
      const myScore = gs.scores[myId] || 0;
      container.innerHTML = `
        <div class="trivia-phone-round-end">
          <div class="trivia-phone-round-title">End of ${esc(gs.roundName)} Round</div>
          <p class="trivia-phone-score">Your score: ${myScore}</p>
          <p class="trivia-phone-status">Next round starting soon...</p>
        </div>`;
      return;
    }

    if (gs.phase === 'gameover') {
      let rankingHtml = '';
      for (let i = 0; i < gs.finalRanking.length; i++) {
        const r = gs.finalRanking[i];
        const isMe = r.id === myId;
        rankingHtml += `
          <div class="trivia-phone-rank${i === 0 ? ' trivia-phone-winner' : ''}${isMe ? ' trivia-phone-me' : ''}">
            <span class="trivia-phone-rank-pos">#${i + 1}</span>
            <span class="trivia-phone-rank-name">${esc(r.name)}</span>
            <span class="trivia-phone-rank-score">${r.score}</span>
          </div>`;
      }

      let playAgainHtml = '';
      if (amHost) {
        playAgainHtml = '<button class="trivia-phone-play-again" id="trivia-play-again">Play Again</button>';
      }

      const isWinner = gs.finalRanking.length > 0 && gs.finalRanking[0].id === myId;

      container.innerHTML = `
        <div class="trivia-phone-gameover">
          ${isWinner ? '<canvas class="trivia-confetti" id="trivia-phone-confetti"></canvas>' : ''}
          <div class="trivia-phone-gameover-title">${isWinner ? 'You Won!' : 'Game Over!'}</div>
          ${rankingHtml}
          ${playAgainHtml}
        </div>`;

      if (isWinner) {
        const confettiCanvas = document.getElementById('trivia-phone-confetti');
        if (confettiCanvas) startConfetti(confettiCanvas);
      }

      const playAgainBtn = document.getElementById('trivia-play-again');
      if (playAgainBtn) {
        playAgainBtn.addEventListener('click', () => {
          socket.emit('game:action', { type: 'playAgain' });
          localState.answered = false;
          localState.lastQuestion = 0;
          localState.lastRound = 0;
        });
      }
      return;
    }
  }

  return { render };
})();
