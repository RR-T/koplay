window.AcrophobiaPhone = (() => {
  let timerInterval = null;
  let localState = { submitted: false, voted: false, lastRound: 0 };

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

  function esc(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function render(container, gs, myId, amHost, players, socket) {
    clearTimerInterval();

    // Reset local flags on new round
    if (gs.round !== localState.lastRound) {
      localState.submitted = false;
      localState.voted = false;
      localState.lastRound = gs.round;
    }

    if (gs.phase === 'error') {
      container.innerHTML = `<p class="acro-phone-error">${esc(gs.message)}</p>`;
      return;
    }

    if (gs.phase === 'submitting') {
      if (localState.submitted) {
        container.innerHTML = `
          <div class="acro-phone-waiting">
            <div class="acro-phone-round">Round ${gs.round} / ${gs.totalRounds}</div>
            <div class="acro-phone-acronym">${esc(gs.acronym)}</div>
            <div class="acro-phone-timer" id="acro-phone-timer"></div>
            <p class="acro-phone-status">Submitted! Waiting for others...</p>
            <div class="acro-phone-progress">${gs.submittedCount} / ${gs.totalPlayers}</div>
          </div>`;
        if (gs.timer) {
          startTimerDisplay(document.getElementById('acro-phone-timer'), gs.timer.endsAt);
        }
        return;
      }

      // Check if form already exists to preserve user input
      const existingForm = container.querySelector('.acro-phone-form');
      if (existingForm) {
        // Just update progress and timer — don't rebuild form
        const prog = container.querySelector('.acro-phone-progress');
        if (prog) prog.textContent = gs.submittedCount + ' / ' + gs.totalPlayers;
        if (gs.timer) {
          const timerEl = document.getElementById('acro-phone-timer');
          if (timerEl && !timerInterval) {
            startTimerDisplay(timerEl, gs.timer.endsAt);
          }
        }
        return;
      }

      container.innerHTML = `
        <div class="acro-phone-submit">
          <div class="acro-phone-round">Round ${gs.round} / ${gs.totalRounds}</div>
          <div class="acro-phone-acronym">${esc(gs.acronym)}</div>
          <div class="acro-phone-timer" id="acro-phone-timer"></div>
          <form class="acro-phone-form">
            <input type="text" class="acro-phone-input" placeholder="Type your acronym..." maxlength="200" autocomplete="off" autocapitalize="off">
            <div class="acro-phone-hint">Each word must start with: ${gs.acronym.split('').join(', ')}</div>
            <div class="acro-phone-validation"></div>
            <button type="submit" class="acro-phone-submit-btn" disabled>Submit</button>
          </form>
          <div class="acro-phone-progress">${gs.submittedCount} / ${gs.totalPlayers}</div>
        </div>`;

      const form = container.querySelector('.acro-phone-form');
      const input = container.querySelector('.acro-phone-input');
      const validationEl = container.querySelector('.acro-phone-validation');
      const submitBtn = container.querySelector('.acro-phone-submit-btn');
      const acronym = gs.acronym;

      input.focus();

      function validate() {
        const text = input.value.trim();
        if (!text) {
          validationEl.textContent = '';
          submitBtn.disabled = true;
          return false;
        }
        const words = text.split(/\s+/);
        if (words.length !== acronym.length) {
          validationEl.textContent = `Need ${acronym.length} words (got ${words.length})`;
          validationEl.className = 'acro-phone-validation invalid';
          submitBtn.disabled = true;
          return false;
        }
        for (let i = 0; i < words.length; i++) {
          if (words[i][0].toUpperCase() !== acronym[i]) {
            validationEl.textContent = `Word ${i + 1} must start with "${acronym[i]}"`;
            validationEl.className = 'acro-phone-validation invalid';
            submitBtn.disabled = true;
            return false;
          }
        }
        validationEl.textContent = 'Looks good!';
        validationEl.className = 'acro-phone-validation valid';
        submitBtn.disabled = false;
        return true;
      }

      input.addEventListener('input', validate);

      form.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!validate()) return;
        const text = input.value.trim();
        socket.emit('game:action', { type: 'submit', text });
        localState.submitted = true;
        render(container, gs, myId, amHost, players, socket);
      });

      if (gs.timer) {
        startTimerDisplay(document.getElementById('acro-phone-timer'), gs.timer.endsAt);
      }
      return;
    }

    if (gs.phase === 'voting') {
      if (localState.voted) {
        container.innerHTML = `
          <div class="acro-phone-waiting">
            <div class="acro-phone-round">Round ${gs.round} / ${gs.totalRounds}</div>
            <div class="acro-phone-acronym">${esc(gs.acronym)}</div>
            <div class="acro-phone-timer" id="acro-phone-timer"></div>
            <p class="acro-phone-status">Voted! Waiting for others...</p>
            <div class="acro-phone-progress">${gs.votedCount} voted</div>
          </div>`;
        if (gs.timer) {
          startTimerDisplay(document.getElementById('acro-phone-timer'), gs.timer.endsAt);
        }
        return;
      }

      let optionsHtml = '';
      for (const opt of gs.votingOptions) {
        optionsHtml += `<button class="acro-phone-vote-btn" data-index="${opt.index}">${esc(opt.text)}</button>`;
      }

      container.innerHTML = `
        <div class="acro-phone-vote">
          <div class="acro-phone-round">Round ${gs.round} / ${gs.totalRounds}</div>
          <div class="acro-phone-acronym">${esc(gs.acronym)}</div>
          <div class="acro-phone-timer" id="acro-phone-timer"></div>
          <p class="acro-phone-label">Vote for your favorite!</p>
          <div class="acro-phone-vote-options">${optionsHtml}</div>
          <div class="acro-phone-progress">${gs.votedCount} voted</div>
        </div>`;

      container.querySelectorAll('.acro-phone-vote-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          const index = parseInt(btn.dataset.index);
          socket.emit('game:action', { type: 'vote', index });
          localState.voted = true;
          render(container, gs, myId, amHost, players, socket);
        });
      });

      if (gs.timer) {
        startTimerDisplay(document.getElementById('acro-phone-timer'), gs.timer.endsAt);
      }
      return;
    }

    if (gs.phase === 'results') {
      let resultsHtml = '';
      const sorted = [...gs.results].sort((a, b) => b.votes - a.votes);
      for (const r of sorted) {
        const isMe = r.authorId === myId;
        resultsHtml += `
          <div class="acro-phone-result${isMe ? ' acro-phone-me' : ''}">
            <div class="acro-phone-result-text">${esc(r.text)}</div>
            <div class="acro-phone-result-meta">${esc(r.author)} — ${r.votes} vote${r.votes !== 1 ? 's' : ''}</div>
          </div>`;
      }
      container.innerHTML = `
        <div class="acro-phone-results">
          <div class="acro-phone-round">Round ${gs.round} / ${gs.totalRounds}</div>
          <div class="acro-phone-acronym">${esc(gs.acronym)}</div>
          ${resultsHtml}
        </div>`;
      return;
    }

    if (gs.phase === 'gameover') {
      let rankingHtml = '';
      for (let i = 0; i < gs.finalRanking.length; i++) {
        const r = gs.finalRanking[i];
        const isMe = r.id === myId;
        rankingHtml += `
          <div class="acro-phone-rank${i === 0 ? ' acro-phone-winner' : ''}${isMe ? ' acro-phone-me' : ''}">
            <span class="acro-phone-rank-pos">#${i + 1}</span>
            <span class="acro-phone-rank-name">${esc(r.name)}</span>
            <span class="acro-phone-rank-score">${r.score}</span>
          </div>`;
      }
      let playAgainHtml = '';
      if (amHost) {
        playAgainHtml = '<button class="acro-phone-play-again" id="acro-play-again">Play Again</button>';
      }
      container.innerHTML = `
        <div class="acro-phone-gameover">
          <div class="acro-phone-gameover-title">Game Over!</div>
          ${rankingHtml}
          ${playAgainHtml}
        </div>`;

      const playAgainBtn = document.getElementById('acro-play-again');
      if (playAgainBtn) {
        playAgainBtn.addEventListener('click', () => {
          socket.emit('game:action', { type: 'playAgain' });
          localState.submitted = false;
          localState.voted = false;
          localState.lastRound = 0;
        });
      }
      return;
    }
  }

  return { render };
})();
