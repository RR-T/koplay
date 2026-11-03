<div align="center">
  <img src="public/tv/icon.png" alt="KoPlay Logo" width="120" />
  <h1>KoPlay</h1>
  <p><strong>JackBox-style party games for a shared screen + phone controllers</strong></p>

  ![Node.js](https://img.shields.io/badge/Node.js-22.x-339933?logo=node.js&logoColor=white)
  ![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
  ![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white)
  ![Socket.IO](https://img.shields.io/badge/Socket.IO-4-010101?logo=socket.io&logoColor=white)
  ![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)
  ![Docker](https://img.shields.io/badge/Docker-ready-2496ED?logo=docker&logoColor=white)
  ![License](https://img.shields.io/badge/license-MIT-green)
</div>

---

## Overview

KoPlay is a local-network party game system. Any monitor with a web browser shows the game and a shareable **QR code** — players join by scanning it on their phones. Everyone just needs to reach the server over the network.

```
┌──────────────────────┐        WebSocket (Socket.IO)
│  Display (monitor +  │ ◄─────────────────────────────┐
│  browser)            │                               │
└──────────────────────┘                        ┌──────┴──────┐
┌──────────────────────┐                        │   Server    │
│  Player Phone (any)  │ ◄─────────────────────►│  (Node.js)  │
└──────────────────────┘                        └─────────────┘
```

## Games

| Game | Description |
|------|-------------|
| **Gorillas** | Classic artillery game — lob bananas at opponents across a destructible skyline |
| **Acrophobia** | Invent funny phrases for a random acronym, then vote for the best one |
| **Trivia** | Three rounds of increasing difficulty — pick a saved quiz from the library, or generate a new one on any topic via Gemini |

## Quick Start

### Option 1 — Docker (recommended)

```bash
docker compose up --build
```

Then open `http://<server-ip>:3000/tv` on the display and `http://<server-ip>:3000` on phones.

### Option 2 — Native Node.js

**Prerequisites:** Node.js 18+

```bash
# Install dependencies
npm install
cd client && npm install && cd ..

# Build the client
npm run build

# Start the server
npm start
```

### Option 3 — Development mode

Run these two commands in separate terminals:

```bash
npm run dev:server   # Express + Socket.IO on :3000
npm run dev:client   # Vite HMR on :5173 (proxies Socket.IO to :3000)
```

## Play from your computer (one command)

Run KoPlay on your own laptop, show the game on the same machine, and let phones join from **anywhere** — they don't need to be on your Wi-Fi. The only prerequisite is [Docker](https://docs.docker.com/get-docker/) (works on Linux and macOS; Windows users can run it under WSL).

```bash
./start.sh        # macOS / Linux  (or: npm run play)
```

The script:

1. creates a private `.env.local` on first run (random host access code + screen ID; optionally add `GEMINI_API_KEY=` there to enable AI quiz generation),
2. starts the app and a [Cloudflare quick tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/do-more-with-tunnels/trycloudflare/) via `docker-compose.local.yml` — no account, domain or router changes needed,
3. prints a public `https://….trycloudflare.com` URL and opens the display in your browser on it, so the on-screen QR code works for phones anywhere.

The first player to join types the printed **host access code** and becomes host. Press Ctrl+C to stop everything. The tunnel URL changes on every run, and anyone with it can reach the game while it is running. Set `LOCAL_PORT` to use a port other than 3000.

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | HTTP/WebSocket server port |
| `GEMINI_API_KEY` | — | **Optional.** Enables AI trivia quiz generation. Without it, players can only pick existing quizzes |
| `GEMINI_MODEL` | `gemini-2.5-flash` | Gemini model to use for quiz generation |
| `QUIZ_USERS` | `{}` | JSON map of `{password: username}` — only listed users can generate or delete trivia quizzes |

Create a `.env` file in the project root to override defaults. See `.env.example`.

## Trivia Quiz Library

Trivia quizzes come from a persistent library. AI generation is **optional**: with no `GEMINI_API_KEY` the "Generate new quiz" option is hidden and hosts can only pick existing quizzes. You can still add quizzes without Gemini by uploading JSON (see below), for example from a local coding agent.

The library is split into two flows so that exposing the app to the internet doesn't let strangers burn through your Gemini quota:

- **Load a saved quiz** — any host can pick a previously-generated quiz from the library. Open to all.
- **Generate a new quiz** — the host enters a password; the server looks it up in `QUIZ_USERS` to identify them, calls Gemini, and saves the result to the library tagged with their username. Only the creator (or someone using the same password) can later delete one of their own quizzes.

Generated quizzes persist to `server/data/quizzes.json` (atomic writes). The Docker compose file mounts this directory as a volume so the library survives container rebuilds.

Configure authors in `.env`:

```bash
QUIZ_USERS={"hunter2":"alex","correcthorse":"sam"}
```

> **Note:** Passwords travel in plaintext over the socket. Fine on HTTPS, sniffable on plain HTTP — terminate TLS (Caddy / Cloudflare Tunnel / Tailscale Funnel) if exposing publicly.

### Uploading quizzes as JSON (no Gemini needed)

Any user with the upload role (`role & 4`, which the generated local host code has) can add a quiz directly:

```bash
curl -X POST http://localhost:3000/api/quiz \
  -H "Authorization: Bearer <access-code>" \
  -H "Content-Type: application/json" \
  -d '{"topic":"Space","rounds":[{"name":"Easy","questions":[
        {"question":"Which planet is known as the Red Planet?",
         "choices":["Venus","Mars","Jupiter","Mercury"],"answer":1}]}]}'
```

Each question needs a `question`, exactly 4 `choices`, and an `answer` index (0–3); `image` (an http(s) URL) is optional. The `/quiz-me` Claude Code command does this for you.

## Architecture

```
tv_games/
├── server/
│   ├── index.js            # Express app + Socket.IO event wiring
│   ├── sessionManager.js   # Single-session state machine (waiting → lobby → playing)
│   ├── quizStore.js        # Persistent trivia quiz library (server/data/quizzes.json)
│   ├── quizUsers.js        # QUIZ_USERS env-var parsing + password → username lookup
│   ├── data/               # Runtime data dir — gitignored, volume-mounted in Docker
│   └── games/
│       ├── index.js        # Game registry
│       ├── gorillas.js
│       ├── acrophobia.js
│       └── trivia.js
├── client/
│   └── src/
│       ├── tv/             # Display app (shared screen)
│       ├── phone/          # Phone controller app
│       ├── games/          # Lazy-loaded game components
│       └── shared/         # Socket context, hooks, shared components
└── public/                 # Static assets
```

### How state flows

Every server-side mutation ends with `broadcastState()`, which emits the full session state to all clients via `session:state`. Clients are purely reactive — they render whatever state they receive.

```
Player action → socket event → sessionManager → game.handleAction()
                                    └──► broadcastState() → all clients re-render
```

## Adding a New Game

1. **Server module** — create `server/games/yourGame.js` exporting:
   ```js
   export default { id, name, description, init, handleAction, onPlayerLeave }
   ```

2. **Register server module** — add to `server/games/index.js`

3. **Client components** — create `client/src/games/yourGame/`:
   - `index.js` — metadata + lazy imports of TV/Phone components
   - `YourGameTV.jsx` — receives `{ gameState, players }`
   - `YourGamePhone.jsx` — receives `{ gameState, myId, isHost, players, emit }`

4. **Register client module** — add to `client/src/games/registry.js` and `availableGames` array

Games are code-split and only fetched when selected.

## Browser Compatibility

The display and phone apps target modern evergreen browsers (Chrome, Firefox, Safari, Edge).

## License

MIT
