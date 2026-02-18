const questionsData = require('./questions.json');

const QUESTION_TIME = 60;
const PRE_REVEAL_TIME = 5;
const MIN_PLAYERS = 1;

// Private state — never broadcast
let roundAnswers = null; // Map<playerId, choiceIndex>
let phaseTimer = null;
let shuffledRounds = null; // questions shuffled per round

function clearTimer() {
  if (phaseTimer) {
    clearTimeout(phaseTimer);
    phaseTimer = null;
  }
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function activePlayers(session) {
  return Array.from(session.players.keys());
}

function getCurrentQuestion(session) {
  const gs = session.gameState;
  const roundIndex = gs.round - 1;
  const qIndex = gs.questionNum - 1;
  return shuffledRounds[roundIndex][qIndex];
}

function startQuestion(session) {
  clearTimer();
  roundAnswers = new Map();

  const q = getCurrentQuestion(session);
  const gs = session.gameState;

  gs.phase = 'question';
  gs.roundName = questionsData.rounds[gs.round - 1].name;
  gs.question = q.question;
  gs.choices = q.choices;
  gs.answeredCount = 0;
  gs.totalPlayers = activePlayers(session).length;
  gs.correctIndex = null;
  gs.playerResults = null;
  gs.choiceCounts = null;
  gs.recentAnswers = [];
  gs.earlyEnd = false;
  gs.timer = {
    endsAt: Date.now() + QUESTION_TIME * 1000,
    duration: QUESTION_TIME,
  };

  session.broadcastState();

  phaseTimer = setTimeout(() => {
    phaseTimer = null;
    endQuestion(session, false);
  }, QUESTION_TIME * 1000);
}

function endQuestion(session, early) {
  clearTimer();
  if (!session.gameState) return;

  const gs = session.gameState;
  gs.phase = 'preReveal';
  gs.earlyEnd = early;
  gs.timer = {
    endsAt: Date.now() + PRE_REVEAL_TIME * 1000,
    duration: PRE_REVEAL_TIME,
  };

  session.broadcastState();

  phaseTimer = setTimeout(() => {
    phaseTimer = null;
    showReveal(session);
  }, PRE_REVEAL_TIME * 1000);
}

function showReveal(session) {
  clearTimer();
  if (!session.gameState) return;

  const q = getCurrentQuestion(session);
  const gs = session.gameState;
  const players = activePlayers(session);

  // Score correct answers
  const playerResults = [];
  for (const id of players) {
    const answer = roundAnswers.get(id);
    const correct = answer === q.answer;
    if (correct) {
      gs.scores[id] = (gs.scores[id] || 0) + 1;
    }
    const player = session.players.get(id);
    playerResults.push({
      name: player ? player.name : '(left)',
      correct,
      avatarId: player ? player.avatarId : null,
      choiceIndex: answer != null ? answer : null,
    });
  }

  // Count votes per choice
  const choiceCounts = [0, 0, 0, 0];
  for (const [, idx] of roundAnswers) {
    if (idx != null && idx >= 0 && idx < 4) choiceCounts[idx]++;
  }

  gs.phase = 'reveal';
  gs.correctIndex = q.answer;
  gs.playerResults = playerResults;
  gs.choiceCounts = choiceCounts;
  gs.recentAnswers = [];
  gs.timer = null;

  session.broadcastState();
}

function nextQuestion(session) {
  clearTimer();
  if (!session.gameState) return;
  const gs = session.gameState;
  const totalQuestions = shuffledRounds[gs.round - 1].length;

  gs.questionNum++;

  if (gs.questionNum > totalQuestions) {
    showRoundEnd(session);
    return;
  }

  startQuestion(session);
}

function showRoundEnd(session) {
  clearTimer();
  const gs = session.gameState;

  gs.phase = 'roundEnd';
  gs.question = null;
  gs.choices = null;
  gs.correctIndex = null;
  gs.playerResults = null;
  gs.choiceCounts = null;
  gs.timer = null;

  session.broadcastState();
}

function nextRound(session) {
  clearTimer();
  if (!session.gameState) return;
  const gs = session.gameState;

  gs.round++;

  if (gs.round > gs.totalRounds) {
    gameOver(session);
    return;
  }

  gs.questionNum = 1;
  gs.totalQuestions = shuffledRounds[gs.round - 1].length;
  startQuestion(session);
}

function gameOver(session) {
  clearTimer();
  const gs = session.gameState;

  gs.phase = 'gameover';
  gs.timer = null;
  gs.question = null;
  gs.choices = null;
  gs.correctIndex = null;
  gs.playerResults = null;
  gs.choiceCounts = null;

  const ranking = activePlayers(session).map((id) => ({
    id,
    name: session.players.get(id).name,
    score: gs.scores[id] || 0,
  }));
  ranking.sort((a, b) => b.score - a.score);
  gs.finalRanking = ranking;

  session.broadcastState();
}

function checkAllAnswered(session) {
  const players = activePlayers(session);
  if (roundAnswers.size >= players.length) {
    endQuestion(session, true);
    return true;
  }
  return false;
}

module.exports = {
  id: 'trivia',
  name: 'Trivia',
  description: 'Answer questions across 3 rounds — easy, medium, hard!',

  init(session) {
    const players = activePlayers(session);

    if (players.length < MIN_PLAYERS) {
      return {
        phase: 'error',
        message: `Need at least ${MIN_PLAYERS} player to start Trivia.`,
      };
    }

    // Shuffle questions within each round
    shuffledRounds = questionsData.rounds.map((r) => shuffle(r.questions));

    roundAnswers = null;
    clearTimer();

    session.gameState = {
      phase: 'characterSelect',
      joinLocked: false,
      round: 1,
      totalRounds: shuffledRounds.length,
      roundName: null,
      questionNum: 1,
      totalQuestions: shuffledRounds[0].length,
      question: null,
      choices: null,
      answeredCount: 0,
      totalPlayers: players.length,
      correctIndex: null,
      playerResults: null,
      choiceCounts: null,
      scores: null,
      recentAnswers: [],
      earlyEnd: false,
      timer: null,
      finalRanking: null,
    };

    return session.gameState;
  },

  handleAction(session, playerId, action) {
    if (!session.gameState || session.gameState.phase === 'error') return;

    if (action.type === 'selectCharacter') {
      if (session.gameState.phase !== 'characterSelect') return;

      const { avatarId, noiseId } = action;
      if (!avatarId || !noiseId) return;

      // Check uniqueness against other players
      for (const [id, player] of session.players) {
        if (id === playerId) continue;
        if (player.avatarId === avatarId) {
          return; // silently ignore — client UI should prevent this
        }
        if (player.noiseId === noiseId) {
          return;
        }
      }

      const player = session.players.get(playerId);
      if (player) {
        player.avatarId = avatarId;
        player.noiseId = noiseId;
      }

      session.broadcastState();
      return;
    }

    if (action.type === 'startGame') {
      if (session.gameState.phase !== 'characterSelect') return;
      if (playerId !== session.hostId) return;

      const gs = session.gameState;
      gs.joinLocked = true;

      // Initialise scores for current players
      const players = activePlayers(session);
      gs.scores = {};
      for (const id of players) {
        gs.scores[id] = 0;
      }

      gs.totalPlayers = players.length;
      gs.roundName = questionsData.rounds[0].name;

      startQuestion(session);
      return;
    }

    if (action.type === 'answer') {
      if (session.gameState.phase !== 'question') return;
      if (!roundAnswers) return;
      if (roundAnswers.has(playerId)) return;

      const index = action.index;
      if (typeof index !== 'number' || index < 0 || index >= session.gameState.choices.length) return;

      roundAnswers.set(playerId, index);
      session.gameState.answeredCount = roundAnswers.size;

      const player = session.players.get(playerId);
      if (player) {
        session.gameState.recentAnswers.push({
          playerId,
          avatarId: player.avatarId,
          noiseId: player.noiseId,
        });
      }

      if (!checkAllAnswered(session)) {
        session.broadcastState();
      }
      return;
    }

    if (action.type === 'advance') {
      if (playerId !== session.hostId) return;
      if (session.gameState.phase === 'reveal') {
        nextQuestion(session);
      } else if (session.gameState.phase === 'roundEnd') {
        nextRound(session);
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

    // During character selection, just update the count and carry on
    if (session.gameState.phase === 'characterSelect') {
      session.gameState.totalPlayers = activePlayers(session).filter((id) => id !== playerId).length;
      return;
    }

    const remaining = activePlayers(session).filter((id) => id !== playerId);
    session.gameState.totalPlayers = remaining.length;

    if (remaining.length < MIN_PLAYERS) {
      clearTimer();
      gameOver(session);
      return;
    }

    if (session.gameState.phase === 'question' && roundAnswers) {
      checkAllAnswered(session);
    }
  },
};
