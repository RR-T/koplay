<div align="center">
  <img src="public/tv/icon.png" alt="KoPlay Logo" width="120" />
  <h1>KoPlay</h1>
  <p><strong>JackBox-style party games for Samsung TV + phone controllers</strong></p>

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

KoPlay is a local-network party game system built to run on a **Raspberry Pi**. A **Samsung TV** displays the game and a shareable **QR code** — players join by scanning it on their phones. No apps, no accounts, no room codes. One game at a time, everyone on the same LAN.

```
┌──────────────────────┐        WebSocket (Socket.IO)
│   Samsung TV (Tizen) │ ◄─────────────────────────────┐
└──────────────────────┘                               │
                                                ┌──────┴──────┐
┌──────────────────────┐                        │ Raspberry Pi │
│  Player Phone (any)  │ ◄─────────────────────►│  (Node.js)   │
└──────────────────────┘                        └─────────────┘
```

## Games

| Game | Description |
|------|-------------|
| **Gorillas** | Classic artillery game — lob bananas at opponents across a destructible skyline |
| **Acrophobia** | Invent funny phrases for a random acronym, then vote for the best one |
| **Trivia** | Three rounds of increasing difficulty — easy, medium, hard |

## Quick Start

### Option 1 — Docker (recommended)

```bash
docker compose up --build
```

Then open `http://<pi-ip>:3000/tv` on the TV and `http://<pi-ip>:3000` on phones.

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

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | HTTP/WebSocket server port |

Create a `.env` file in the project root to override defaults.

## Architecture

```
tv_games/
├── server/
│   ├── index.js            # Express app + Socket.IO event wiring
│   ├── sessionManager.js   # Single-session state machine (waiting → lobby → playing)
│   └── games/
│       ├── index.js        # Game registry
│       ├── gorillas.js
│       ├── acrophobia.js
│       └── trivia.js
├── client/
│   └── src/
│       ├── tv/             # TV display app (Samsung Tizen 5 / Chrome 63)
│       ├── phone/          # Phone controller app
│       ├── games/          # Lazy-loaded game components
│       └── shared/         # Socket context, hooks, shared components
└── public/                 # Static assets (legacy TV build)
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

## TV Compatibility

The TV client targets **Samsung Tizen 5.0** (Chrome 63). Avoid these CSS features in TV-facing components:

- `oklch()` / `color-mix()` — use hex instead
- `padding-inline` / `margin-block` — use physical properties
- `gap` on **flex** containers — use `space-x-*` / `space-y-*`
- `aspect-ratio`, `clamp()`, `min()`, `max()`

The Vite build plugin auto-patches Tailwind output for Chrome 63 compatibility.

## License

MIT
