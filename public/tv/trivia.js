window.TriviaTV = (() => {
  let timerInterval = null;
  let confettiAnim = null;

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

    for (let i = 0; i < 120; i++) {
      pieces.push({
        x: Math.random() * canvas.width,
        y: Math.random() * -canvas.height,
        w: Math.random() * 8 + 4,
        h: Math.random() * 6 + 3,
        color: colors[Math.floor(Math.random() * colors.length)],
        vx: (Math.random() - 0.5) * 3,
        vy: Math.random() * 3 + 2,
        rot: Math.random() * Math.PI * 2,
        rv: (Math.random() - 0.5) * 0.15,
      });
    }

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;

      for (const p of pieces) {
        p.x += p.vx;
        p.vy += 0.04;
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

  function renderScoreboard(scores, players) {
    const entries = players.map((p) => ({
      name: p.name,
      score: scores[p.id] || 0,
    }));
    entries.sort((a, b) => b.score - a.score);

    let html = '<div class="trivia-scoreboard"><h3>Scores</h3><ul>';
    for (const e of entries) {
      html += `<li><span class="trivia-score-name">${esc(e.name)}</span><span class="trivia-score-val">${e.score}</span></li>`;
    }
    html += '</ul></div>';
    return html;
  }

  const CHOICE_LABELS = ['A', 'B', 'C', 'D'];

  function render(container, gs, players) {
    clearTimerInterval();
    if (gs.phase !== 'gameover') stopConfetti();

    if (gs.phase === 'error') {
      container.innerHTML = `<p class="trivia-error">${esc(gs.message)}</p>`;
      return;
    }

    if (gs.phase === 'question') {
      let choicesHtml = '';
      for (let i = 0; i < gs.choices.length; i++) {
        choicesHtml += `
          <div class="trivia-choice">
            <span class="trivia-choice-label">${CHOICE_LABELS[i]}</span>
            <span class="trivia-choice-text">${esc(gs.choices[i])}</span>
          </div>`;
      }

      container.innerHTML = `
        <div class="trivia-question-screen">
          <div class="trivia-header">
            <span class="trivia-round">${esc(gs.roundName)} — Round ${gs.round}/${gs.totalRounds}</span>
            <span class="trivia-qnum">Question ${gs.questionNum}/${gs.totalQuestions}</span>
          </div>
          <div class="trivia-timer" id="trivia-timer"></div>
          <div class="trivia-question">${esc(gs.question)}</div>
          <div class="trivia-choices">${choicesHtml}</div>
          <div class="trivia-progress">${gs.answeredCount} / ${gs.totalPlayers} answered</div>
        </div>`;

      if (gs.timer) {
        startTimerDisplay(document.getElementById('trivia-timer'), gs.timer.endsAt);
      }
      return;
    }

    if (gs.phase === 'reveal') {
      let choicesHtml = '';
      for (let i = 0; i < gs.choices.length; i++) {
        const isCorrect = i === gs.correctIndex;
        choicesHtml += `
          <div class="trivia-choice ${isCorrect ? 'trivia-correct' : 'trivia-wrong'}">
            <span class="trivia-choice-label">${CHOICE_LABELS[i]}</span>
            <span class="trivia-choice-text">${esc(gs.choices[i])}</span>
            ${isCorrect ? '<span class="trivia-check">&#10003;</span>' : ''}
          </div>`;
      }

      let resultsHtml = '';
      if (gs.playerResults) {
        const correct = gs.playerResults.filter((r) => r.correct);
        if (correct.length > 0) {
          resultsHtml = '<div class="trivia-who-correct"><span class="trivia-correct-label">Correct:</span> ' +
            correct.map((r) => esc(r.name)).join(', ') + '</div>';
        } else {
          resultsHtml = '<div class="trivia-who-correct"><span class="trivia-nobody">Nobody got it!</span></div>';
        }
      }

      container.innerHTML = `
        <div class="trivia-reveal-screen">
          <div class="trivia-header">
            <span class="trivia-round">${esc(gs.roundName)} — Round ${gs.round}/${gs.totalRounds}</span>
            <span class="trivia-qnum">Question ${gs.questionNum}/${gs.totalQuestions}</span>
          </div>
          <div class="trivia-question">${esc(gs.question)}</div>
          <div class="trivia-choices">${choicesHtml}</div>
          ${resultsHtml}
          ${renderScoreboard(gs.scores, players)}
        </div>`;
      return;
    }

    if (gs.phase === 'roundEnd') {
      container.innerHTML = `
        <div class="trivia-round-end">
          <div class="trivia-round-end-title">End of ${esc(gs.roundName)} Round</div>
          ${renderScoreboard(gs.scores, players)}
          <div class="trivia-next-round">Next round starting soon...</div>
        </div>`;
      return;
    }

    if (gs.phase === 'gameover') {
      let rankingHtml = '';
      for (let i = 0; i < gs.finalRanking.length; i++) {
        const r = gs.finalRanking[i];
        const cls = i === 0 ? 'trivia-winner' : '';
        rankingHtml += `
          <li class="trivia-rank-item ${cls}">
            <span class="trivia-rank-pos">#${i + 1}</span>
            <span class="trivia-rank-name">${esc(r.name)}</span>
            <span class="trivia-rank-score">${r.score}</span>
          </li>`;
      }
      container.innerHTML = `
        <div class="trivia-gameover">
          <canvas class="trivia-confetti" id="trivia-confetti"></canvas>
          <div class="trivia-gameover-title">Game Over!</div>
          <ul class="trivia-ranking">${rankingHtml}</ul>
        </div>`;

      const confettiCanvas = document.getElementById('trivia-confetti');
      if (confettiCanvas) startConfetti(confettiCanvas);
      return;
    }
  }

  return { render };
})();
