const QUESTION_TIME = 60;
const MIN_PLAYERS = 1;

// Private state — never broadcast
let roundAnswers = null; // Map<playerId, choiceIndex>
let phaseTimer = null;
let shuffledRounds = null; // questions shuffled per round
let currentRounds = null;  // [{name, questions}] from Gemini

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

async function generateQuestions(topic) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not set in environment');

  const prompt = `Generate a trivia quiz about "${topic}" with 3 difficulty rounds.
Return ONLY a valid JSON object with no markdown formatting, code blocks, or explanation.
Use this exact structure:
{
  "rounds": [
    {
      "name": "Easy",
      "questions": [
        {"question": "...", "choices": ["A", "B", "C", "D"], "answer": 0}
      ]
    },
    {"name": "Medium", "questions": [...]},
    {"name": "Hard", "questions": [...]}
  ]
}
Rules:
- Exactly 10 questions per round (30 total)
- Exactly 4 choices per question
- "answer" is the 0-based index of the correct choice (0, 1, 2, or 3)
- Easy questions should be general knowledge, Medium moderately challenging, Hard quite difficult
- All questions must be factually accurate
- Vary which index the correct answer appears at`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { response_mime_type: 'application/json' },
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Gemini API error ${response.status}: ${text.slice(0, 200)}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('No content in Gemini response');

  const parsed = JSON.parse(text);
  if (!Array.isArray(parsed.rounds) || parsed.rounds.length < 3) {
    throw new Error('Invalid rounds structure in response');
  }
  for (const round of parsed.rounds) {
    if (!Array.isArray(round.questions) || round.questions.length < 5) {
      throw new Error('Invalid questions structure in response');
    }
  }

  return parsed.rounds;
}

function showRoundIntro(session) {
  clearTimer();
  if (!session.gameState) return;
  const gs = session.gameState;

  gs.phase = 'roundIntro';
  gs.roundName = currentRounds[gs.round - 1].name;
  gs.question = null;
  gs.choices = null;
  gs.timer = null;

  session.broadcastState();
}

function startQuestion(session) {
  clearTimer();
  roundAnswers = new Map();

  const q = getCurrentQuestion(session);
  const gs = session.gameState;

  gs.phase = 'question';
  gs.roundName = currentRounds[gs.round - 1].name;
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

  session.gameState.earlyEnd = early;
  showReveal(session);
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
  showRoundIntro(session);
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

    shuffledRounds = null;
    currentRounds = null;
    roundAnswers = null;
    clearTimer();

    session.gameState = {
      phase: 'topicSelect',
      topic: null,
      error: null,
      joinLocked: false,
      round: null,
      totalRounds: null,
      roundName: null,
      questionNum: null,
      totalQuestions: null,
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

    if (action.type === 'setTopic') {
      if (session.gameState.phase !== 'topicSelect') return;
      if (playerId !== session.hostId) return;

      const topic = (action.topic || '').trim();
      if (!topic) return;

      session.gameState.phase = 'generating';
      session.gameState.topic = topic;
      session.gameState.error = null;
      session.broadcastState();

      generateQuestions(topic).then((rounds) => {
        if (!session.gameState) return;
        currentRounds = rounds;
        shuffledRounds = rounds.map((r) => shuffle(r.questions));

        Object.assign(session.gameState, {
          phase: 'characterSelect',
          joinLocked: false,
          round: 1,
          totalRounds: rounds.length,
          roundName: null,
          questionNum: 1,
          totalQuestions: shuffledRounds[0].length,
          question: null,
          choices: null,
          answeredCount: 0,
          totalPlayers: activePlayers(session).length,
          correctIndex: null,
          playerResults: null,
          choiceCounts: null,
          scores: null,
          recentAnswers: [],
          earlyEnd: false,
          timer: null,
          finalRanking: null,
        });
        session.broadcastState();
      }).catch((err) => {
        if (!session.gameState) return;
        console.error('Gemini generation failed:', err.message);
        session.gameState.phase = 'topicSelect';
        session.gameState.error = 'Failed to generate questions — please try again.';
        session.broadcastState();
      });
      return;
    }

    if (action.type === 'selectCharacter') {
      if (session.gameState.phase !== 'characterSelect') return;

      const { avatarId, noiseId } = action;
      if (!avatarId || !noiseId) return;

      // Check uniqueness against other players
      for (const [id, player] of session.players) {
        if (id === playerId) continue;
        if (player.avatarId === avatarId) return;
        if (player.noiseId === noiseId) return;
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

      const players = activePlayers(session);
      gs.scores = {};
      for (const id of players) {
        gs.scores[id] = 0;
      }

      gs.totalPlayers = players.length;

      showRoundIntro(session);
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

      // Always broadcast question-phase update first so TV plays the sound,
      // then check if all answered and transition to reveal if so.
      session.broadcastState();
      checkAllAnswered(session);
      return;
    }

    if (action.type === 'advance') {
      if (playerId !== session.hostId) return;
      if (session.gameState.phase === 'roundIntro') {
        startQuestion(session);
      } else if (session.gameState.phase === 'reveal') {
        nextQuestion(session);
      } else if (session.gameState.phase === 'roundEnd') {
        nextRound(session);
      }
      return;
    }

    if (action.type === 'playAgain') {
      const phase = session.gameState.phase;
      const isLastRoundEnd = phase === 'roundEnd' && session.gameState.round === session.gameState.totalRounds;
      if (phase !== 'gameover' && !isLastRoundEnd) return;
      if (playerId !== session.hostId) return;

      this.init(session);
      session.broadcastState();
      return;
    }
  },

  onPlayerLeave(session, playerId) {
    if (!session.gameState || session.gameState.phase === 'error') return;

    if (
      session.gameState.phase === 'topicSelect' ||
      session.gameState.phase === 'generating' ||
      session.gameState.phase === 'characterSelect'
    ) {
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
