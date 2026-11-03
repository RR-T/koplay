---
name: koplay-quiz
description: Generate a trivia quiz on any topic and put it on the user's local KoPlay screen. Use when the user asks to be quizzed on something (a topic, this codebase, a document), says "quiz me", "/koplay-quiz", "generate a quiz", or asks to push or send a quiz to the screen or TV.
---

Write a trivia quiz from the user's topic or context (analyse the codebase, document or subject at hand if needed), add it to their KoPlay running on this computer, and send it to their screen.

Everything stays on this machine: only ever talk to `localhost`. Never send quiz content to any other host.

KoPlay is installed at `__KOPLAY_DIR__`.

## Step 1: Generate the quiz

Create a trivia quiz with exactly 3 rounds (Easy, Medium, Hard) of 10 questions each (30 total), unless the user asks for a different number of questions or rounds.

Rules:
- Each question has exactly 4 `choices` (strings) and an `answer` (0-based index of the correct choice, 0 to 3)
- Vary which index is correct; don't cluster answers at index 0
- Questions must be factually accurate
- Easy = general knowledge, Medium = moderately challenging, Hard = quite difficult

Use exactly this JSON structure (raw object, no markdown fences):

```json
{
  "topic": "<topic>",
  "rounds": [
    {"name": "Easy", "questions": [{"question": "...", "choices": ["...", "...", "...", "..."], "answer": 0}]},
    {"name": "Medium", "questions": [...]},
    {"name": "Hard", "questions": [...]}
  ]
}
```

## Step 2: Check KoPlay is running

```bash
KOPLAY_DIR="__KOPLAY_DIR__"
PORT=$(sed -n 's/^LOCAL_PORT=\([0-9]*\).*/\1/p' "$KOPLAY_DIR/.env.local" 2>/dev/null | head -1); PORT=${PORT:-4747}
SCREEN=$(sed -n "s/^SCREENS='{\"\([^\"]*\)\".*/\1/p" "$KOPLAY_DIR/.env.local" 2>/dev/null)
curl -fs -o /dev/null "http://localhost:$PORT/" && echo "running on $PORT" || echo "NOT RUNNING"
```

If it is not running, tell the user to start it with `./start.sh` in `__KOPLAY_DIR__` and then ask again. Do not start it yourself (it opens a public tunnel). Stop here.

## Step 3: Upload the quiz

Write the JSON to a temp file (for example with `mktemp`), then:

```bash
curl -s -X POST "http://localhost:$PORT/api/quiz" \
  -H "Content-Type: application/json" \
  -d @"$QUIZ_FILE"
```

No token is needed. Parse the `id` from the response. If it contains an `error`, report it and stop.

## Step 4: Send it to the screen

If `$SCREEN` is non-empty:

```bash
curl -s -X POST "http://localhost:$PORT/api/screen/push" \
  -H "Content-Type: application/json" \
  -d "{\"screenUuid\": \"$SCREEN\", \"quizId\": \"<id>\"}"
```

If the response contains an `error`, report it. Otherwise it returns `gameCode` and `topic`.

If `$SCREEN` is empty, skip this step and tell the user the quiz was added to their library; the host can pick it from the quiz list.

## Step 5: Tell the user

Say the quiz "<topic>" is ready. Players scan the QR code on the screen, or enter the 5-letter game code (`gameCode`), and the first player to join becomes host and starts the quiz. If the screen isn't open yet, they open the display link printed by `./start.sh`.
