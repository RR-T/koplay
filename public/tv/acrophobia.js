window.AcrophobiaTV = (() => {
  let timerInterval = null;

  function clearTimerInterval() {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
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

  function renderScoreboard(scores, players) {
    const entries = players.map((p) => ({
      name: p.name,
      score: scores[p.id] || 0,
    }));
    entries.sort((a, b) => b.score - a.score);

    let html = '<div class="acro-scoreboard"><h2>Scores</h2><ul>';
    for (const e of entries) {
      html += `<li><span class="acro-score-name">${esc(e.name)}</span><span class="acro-score-val">${e.score}</span></li>`;
    }
    html += '</ul></div>';
    return html;
  }

  function esc(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function render(container, gs, players) {
    clearTimerInterval();

    if (gs.phase === 'error') {
      container.innerHTML = `<p class="acro-error">${esc(gs.message)}</p>`;
      return;
    }

    if (gs.phase === 'submitting') {
      container.innerHTML = `
        <div class="acro-submitting">
          <div class="acro-round">Round ${gs.round} / ${gs.totalRounds}</div>
          <div class="acro-acronym">${esc(gs.acronym)}</div>
          <div class="acro-timer" id="acro-timer"></div>
          <div class="acro-progress">${gs.submittedCount} / ${gs.totalPlayers} submitted</div>
          ${renderScoreboard(gs.scores, players)}
        </div>`;
      if (gs.timer) {
        startTimerDisplay(document.getElementById('acro-timer'), gs.timer.endsAt);
      }
      return;
    }

    if (gs.phase === 'voting') {
      let optionsHtml = '';
      for (const opt of gs.votingOptions) {
        optionsHtml += `<li class="acro-vote-option"><span class="acro-option-num">${opt.index + 1}.</span> ${esc(opt.text)}</li>`;
      }
      container.innerHTML = `
        <div class="acro-voting">
          <div class="acro-round">Round ${gs.round} / ${gs.totalRounds}</div>
          <div class="acro-acronym">${esc(gs.acronym)}</div>
          <div class="acro-timer" id="acro-timer"></div>
          <ul class="acro-options-list">${optionsHtml}</ul>
          <div class="acro-progress">${gs.votedCount} voted</div>
          ${renderScoreboard(gs.scores, players)}
        </div>`;
      if (gs.timer) {
        startTimerDisplay(document.getElementById('acro-timer'), gs.timer.endsAt);
      }
      return;
    }

    if (gs.phase === 'results') {
      let resultsHtml = '';
      const sorted = [...gs.results].sort((a, b) => b.votes - a.votes);
      for (const r of sorted) {
        resultsHtml += `
          <li class="acro-result-item${r.votes > 0 ? ' acro-has-votes' : ''}">
            <div class="acro-result-text">${esc(r.text)}</div>
            <div class="acro-result-meta">
              <span class="acro-result-author">${esc(r.author)}</span>
              <span class="acro-result-votes">${r.votes} vote${r.votes !== 1 ? 's' : ''}</span>
            </div>
          </li>`;
      }
      container.innerHTML = `
        <div class="acro-results">
          <div class="acro-round">Round ${gs.round} / ${gs.totalRounds}</div>
          <div class="acro-acronym">${esc(gs.acronym)}</div>
          <ul class="acro-results-list">${resultsHtml}</ul>
          ${renderScoreboard(gs.scores, players)}
        </div>`;
      return;
    }

    if (gs.phase === 'gameover') {
      let rankingHtml = '';
      for (let i = 0; i < gs.finalRanking.length; i++) {
        const r = gs.finalRanking[i];
        const cls = i === 0 ? 'acro-winner' : '';
        rankingHtml += `
          <li class="acro-rank-item ${cls}">
            <span class="acro-rank-pos">#${i + 1}</span>
            <span class="acro-rank-name">${esc(r.name)}</span>
            <span class="acro-rank-score">${r.score}</span>
          </li>`;
      }
      container.innerHTML = `
        <div class="acro-gameover">
          <div class="acro-gameover-title">Game Over!</div>
          <ul class="acro-ranking">${rankingHtml}</ul>
        </div>`;
      return;
    }
  }

  return { render };
})();
