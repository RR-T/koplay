const TOTAL_ROUNDS = 5;
const SUBMIT_TIME = 60;
const VOTE_TIME = 30;
const RESULTS_TIME = 8;
const MIN_PLAYERS = 3;

// Private state — never broadcast
let roundData = null;
let phaseTimer = null;

function generateAcronym() {
  const consonants = 'BCDFGHJKLMNPRSTVW';
  const vowels = 'AEIOU';
  const all = consonants + vowels;
  const letters = [];
  for (let i = 0; i < 3; i++) {
    letters.push(all[Math.floor(Math.random() * all.length)]);
  }
  return letters.join('');
}

function clearTimer() {
  if (phaseTimer) {
    clearTimeout(phaseTimer);
    phaseTimer = null;
  }
}

function startPhase(session, phase, durationSec, onExpire) {
  clearTimer();
  session.gameState.phase = phase;
  session.gameState.timer = {
    endsAt: Date.now() + durationSec * 1000,
    duration: durationSec,
  };
  phaseTimer = setTimeout(() => {
    phaseTimer = null;
    onExpire();
  }, durationSec * 1000);
}

function activePlayers(session) {
  return Array.from(session.players.keys());
}

function startSubmitting(session) {
  const acronym = generateAcronym();
  const players = activePlayers(session);

  roundData = {
    submissions: new Map(),
    votes: new Map(),
    shuffledOrder: [],
    acronym,
  };

  session.gameState.acronym = acronym;
  session.gameState.submittedCount = 0;
  session.gameState.totalPlayers = players.length;
  session.gameState.votingOptions = null;
  session.gameState.votedCount = 0;
  session.gameState.results = null;

  startPhase(session, 'submitting', SUBMIT_TIME, () => {
    endSubmitting(session);
  });

  session.broadcastState();
}

function endSubmitting(session) {
  clearTimer();

  if (roundData.submissions.size === 0) {
    // No submissions — skip to results with empty
    showResults(session);
    return;
  }

  if (roundData.submissions.size === 1) {
    // Only one submission — skip voting, give them 1 point
    const [authorId] = roundData.submissions.keys();
    session.gameState.scores[authorId] = (session.gameState.scores[authorId] || 0) + 1;
    showResults(session);
    return;
  }

  // Shuffle submissions for anonymous voting
  const entries = Array.from(roundData.submissions.entries());
  for (let i = entries.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [entries[i], entries[j]] = [entries[j], entries[i]];
  }

  roundData.shuffledOrder = entries;
  session.gameState.votingOptions = entries.map(([, text], idx) => ({
    index: idx,
    text,
  }));
  session.gameState.votedCount = 0;

  startPhase(session, 'voting', VOTE_TIME, () => {
    endVoting(session);
  });

  session.broadcastState();
}

function endVoting(session) {
  clearTimer();

  // Tally votes
  for (const [, votedIndex] of roundData.votes) {
    const [authorId] = roundData.shuffledOrder[votedIndex];
    session.gameState.scores[authorId] = (session.gameState.scores[authorId] || 0) + 1;
  }

  showResults(session);
}

function showResults(session) {
  clearTimer();

  // Build results with author reveals
  const results = roundData.shuffledOrder.map(([authorId, text], idx) => {
    let voteCount = 0;
    for (const [, votedIndex] of roundData.votes) {
      if (votedIndex === idx) voteCount++;
    }
    const player = session.players.get(authorId);
    return {
      text,
      author: player ? player.name : '(left)',
      authorId,
      votes: voteCount,
    };
  });

  session.gameState.results = results;
  session.gameState.phase = 'results';
  session.gameState.timer = {
    endsAt: Date.now() + RESULTS_TIME * 1000,
    duration: RESULTS_TIME,
  };

  session.broadcastState();

  phaseTimer = setTimeout(() => {
    phaseTimer = null;
    nextRound(session);
  }, RESULTS_TIME * 1000);
}

function nextRound(session) {
  clearTimer();
  session.gameState.round++;

  if (session.gameState.round > TOTAL_ROUNDS) {
    gameOver(session);
    return;
  }

  startSubmitting(session);
}

function gameOver(session) {
  clearTimer();
  session.gameState.phase = 'gameover';
  session.gameState.timer = null;

  // Build final ranking
  const ranking = activePlayers(session).map((id) => ({
    id,
    name: session.players.get(id).name,
    score: session.gameState.scores[id] || 0,
  }));
  ranking.sort((a, b) => b.score - a.score);
  session.gameState.finalRanking = ranking;

  session.broadcastState();
}

function checkEarlyAdvance(session) {
  const players = activePlayers(session);

  if (session.gameState.phase === 'submitting') {
    if (roundData.submissions.size >= players.length) {
      endSubmitting(session);
      return true;
    }
  }

  if (session.gameState.phase === 'voting') {
    // Count eligible voters (those who can vote — everyone except single-submission author)
    const eligibleVoters = players.filter((id) => {
      // Exclude players whose submission is the only option (handled by canVote check)
      return true;
    });
    if (roundData.votes.size >= eligibleVoters.length) {
      endVoting(session);
      return true;
    }
  }

  return false;
}

module.exports = {
  id: 'acrophobia',
  name: 'Acrophobia',
  description: 'Make up funny acronyms and vote for the best!',

  init(session) {
    const players = activePlayers(session);

    if (players.length < MIN_PLAYERS) {
      return {
        phase: 'error',
        message: `Need at least ${MIN_PLAYERS} players to start Acrophobia.`,
      };
    }

    const scores = {};
    for (const id of players) {
      scores[id] = 0;
    }

    session.gameState = {
      phase: 'submitting',
      round: 1,
      totalRounds: TOTAL_ROUNDS,
      acronym: '',
      submittedCount: 0,
      totalPlayers: players.length,
      scores,
      timer: null,
      votingOptions: null,
      votedCount: 0,
      results: null,
      finalRanking: null,
    };

    roundData = null;
    clearTimer();
    startSubmitting(session);

    return session.gameState;
  },

  handleAction(session, playerId, action) {
    if (!session.gameState || session.gameState.phase === 'error') return;

    if (action.type === 'submit') {
      if (session.gameState.phase !== 'submitting') return;
      if (!roundData) return;
      if (roundData.submissions.has(playerId)) return;

      const text = (action.text || '').trim();
      if (!text || text.length > 200) return;

      // Validate: word count matches acronym length, each word starts with correct letter
      const words = text.split(/\s+/);
      const acronym = roundData.acronym;
      if (words.length !== acronym.length) return;
      for (let i = 0; i < words.length; i++) {
        if (words[i][0].toUpperCase() !== acronym[i]) return;
      }

      roundData.submissions.set(playerId, text);
      session.gameState.submittedCount = roundData.submissions.size;

      if (!checkEarlyAdvance(session)) {
        session.broadcastState();
      }
      return;
    }

    if (action.type === 'vote') {
      if (session.gameState.phase !== 'voting') return;
      if (!roundData) return;
      if (roundData.votes.has(playerId)) return;

      const index = action.index;
      if (typeof index !== 'number' || index < 0 || index >= roundData.shuffledOrder.length) return;

      // Can't vote for own submission
      const [authorId] = roundData.shuffledOrder[index];
      if (authorId === playerId) return;

      roundData.votes.set(playerId, index);
      session.gameState.votedCount = roundData.votes.size;

      if (!checkEarlyAdvance(session)) {
        session.broadcastState();
      }
      return;
    }

    if (action.type === 'playAgain') {
      if (session.gameState.phase !== 'gameover') return;
      if (playerId !== session.hostId) return;

      this.init(session);
      session.broadcastState();
      return;
    }
  },

  onPlayerLeave(session, playerId) {
    if (!session.gameState || session.gameState.phase === 'error') return;

    // Update total players
    const remaining = activePlayers(session).filter((id) => id !== playerId);
    session.gameState.totalPlayers = remaining.length;

    if (remaining.length < MIN_PLAYERS) {
      clearTimer();
      gameOver(session);
      return;
    }

    // Check if leaving player allows phase to advance
    if (session.gameState.phase === 'submitting' || session.gameState.phase === 'voting') {
      checkEarlyAdvance(session);
    }
  },
};
