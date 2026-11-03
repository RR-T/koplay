# Access, quizzes and the upload API

## Local play (`./start.sh`)

`docker-compose.local.yml` sets `LOCAL_MODE=1`. In this mode there are no passwords:

- the display at `/screen/<id>` belongs to the local owner (`LOCAL_USER`, the name saved quizzes are filed under), so the first phone to join is host without entering anything;
- `POST /api/quiz` and `POST /api/screen/push` need no token, but are refused (403) when a request arrives through the Cloudflare tunnel, and the port is bound to `127.0.0.1`, so only programs on your own machine can use them.

The sections below describe the password-based setup used by a normal server deployment (without `LOCAL_MODE`).

## Users and roles

`USERS` is a JSON map of access code to user. `role` is a bitmask:

| Bit | Role | Allows |
|-----|------|--------|
| 1 | interactive | Log in at `/screen` or be host of a room |
| 2 | generate | Generate trivia quizzes with Gemini (also needs `GEMINI_API_KEY`) |
| 4 | upload | `POST /api/quiz` and `POST /api/screen/push` |
| 8 | admin | See and delete every quiz, not only your own |

```bash
USERS='{"hunter2":{"name":"alex","role":15}}'
```

Access codes travel in plaintext over the socket and API, so use HTTPS if the app is reachable from the internet (the Cloudflare tunnel in `start.sh` does this).

## Screens

`SCREENS` registers display IDs so a display can open `/screen/<id>` without logging in. The host phone then enters an access code (a password from `USERS`) when it joins; this is not the 5-letter game code shown on the display.

```bash
SCREENS='{"<uuid>":{"label":"Living room","owners":["alex"]}}'
```

`owners` are user names allowed to push a quiz to that screen.

## Quizzes

Quizzes persist to `server/data/quizzes.json`. Users see and delete their own quizzes; admins see all. Generating with Gemini is optional. Without `GEMINI_API_KEY` the Generate button is hidden, and you can still add quizzes by uploading JSON.

## Upload a quiz (no Gemini needed)

Requires the upload role (in local play no token is needed; use `http://localhost:4747`):

```bash
curl -X POST http://localhost:4747/api/quiz \
  -H "Authorization: Bearer <access-code>" \
  -H "Content-Type: application/json" \
  -d '{"topic":"Space","rounds":[{"name":"Easy","questions":[
        {"question":"Which planet is known as the Red Planet?",
         "choices":["Venus","Mars","Jupiter","Mercury"],"answer":1}]}]}'
```

Each question needs `question`, exactly four `choices`, and an `answer` index (0-3). `image` (an http(s) URL) is optional. The `/quiz-me` Claude Code command does this for you.

## Push a quiz to a screen

`POST /api/screen/push` with `{"screenUuid": "...", "quizId": "..."}` and the same bearer token. The token's user must be an owner of the screen.
