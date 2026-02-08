const questionsData = require('./questions.json');

const QUESTION_TIME = 15;
const REVEAL_TIME = 5;
const ROUND_END_TIME = 8;
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
  gs.timer = {
    endsAt: Date.now() + QUESTION_TIME * 1000,
    duration: QUESTION_TIME,
  };

  session.broadcastState();

  phaseTimer = setTimeout(() => {
    phaseTimer = null;
    endQuestion(session);
  }, QUESTION_TIME * 1000);
}

function endQuestion(session) {
  clearTimer();

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
    });
  }

  gs.phase = 'reveal';
  gs.correctIndex = q.answer;
  gs.playerResults = playerResults;
  gs.timer = {
    endsAt: Date.now() + REVEAL_TIME * 1000,
    duration: REVEAL_TIME,
  };

  session.broadcastState();

  phaseTimer = setTimeout(() => {
    phaseTimer = null;
    nextQuestion(session);
  }, REVEAL_TIME * 1000);
}

function nextQuestion(session) {
  clearTimer();
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
  gs.timer = {
    endsAt: Date.now() + ROUND_END_TIME * 1000,
    duration: ROUND_END_TIME,
  };

  session.broadcastState();

  phaseTimer = setTimeout(() => {
    phaseTimer = null;
    nextRound(session);
  }, ROUND_END_TIME * 1000);
}

function nextRound(session) {
  clearTimer();
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
    endQuestion(session);
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

    const scores = {};
    for (const id of players) {
      scores[id] = 0;
    }

    session.gameState = {
      phase: 'question',
      round: 1,
      totalRounds: shuffledRounds.length,
      roundName: questionsData.rounds[0].name,
      questionNum: 1,
      totalQuestions: shuffledRounds[0].length,
      question: '',
      choices: [],
      answeredCount: 0,
      totalPlayers: players.length,
      correctIndex: null,
      playerResults: null,
      scores,
      timer: null,
      finalRanking: null,
    };

    roundAnswers = null;
    clearTimer();
    startQuestion(session);

    return session.gameState;
  },

  handleAction(session, playerId, action) {
    if (!session.gameState || session.gameState.phase === 'error') return;

    if (action.type === 'answer') {
      if (session.gameState.phase !== 'question') return;
      if (!roundAnswers) return;
      if (roundAnswers.has(playerId)) return;

      const index = action.index;
      if (typeof index !== 'number' || index < 0 || index >= session.gameState.choices.length) return;

      roundAnswers.set(playerId, index);
      session.gameState.answeredCount = roundAnswers.size;

      if (!checkAllAnswered(session)) {
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
