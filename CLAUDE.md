# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

JackBox-style party game system for Samsung TV + phone controllers. A TV displays the game, players join via phones by scanning a QR code. Runs on a Raspberry Pi on the LAN. Single session model — no room codes, one game at a time, all state in-memory.

## Commands

- **Run server:** `node server/index.js` (serves on port 3000, configurable via `PORT` env var)
- **Build client:** `npm run build` (runs Vite build in client/)
- **Dev mode:** Run `npm run dev:server` and `npm run dev:client` in separate terminals. Vite dev server on port 5173 proxies Socket.IO to port 3000.
- **Install deps:** `npm install` (server) and `cd client && npm install` (client)
- **Docker:** `docker compose up --build`

## Architecture

### Server (Node.js + Express + Socket.IO)

- `server/index.js` — Express app + Socket.IO event wiring. Serves built client from `client/dist/`, handles all socket events, calls into sessionManager and game modules, broadcasts state after every mutation via `io.emit('session:state', ...)`.
- `server/sessionManager.js` — Singleton managing one global session. State machine: `waiting` → `lobby` (first player joins) → `playing` (host selects game). Tracks players (Map keyed by socket ID), host (first joiner, auto-promoted on disconnect), current game, and game state.
- `server/games/index.js` — Game registry (Map of id → game module). To add a game: create a module in `server/games/`, add it to this registry.
- `server/games/lobby.js` — Reference game module. Every game exports: `{ id, name, description, init(session), handleAction(session, playerId, action), onPlayerLeave(session, playerId) }`.

### Client (React + Vite + Tailwind CSS)

Two separate React apps built by Vite with shared code:

- `client/src/tv/` — TV display app (`/tv`). Screens: intro video, waiting (QR code), lobby (player list), playing (lazy-loaded game component).
- `client/src/phone/` — Phone controller app (`/phone`, also served at `/`). Screens: join form, waiting, lobby-host (game selector), lobby-player, playing (lazy-loaded game component).
- `client/src/shared/` — Shared React context (SocketContext), hooks (useTimer), and components (Timer, PlayerList, Scoreboard, Rankings, PlayAgainButton, ConfettiCanvas, QRCodeCanvas).
- `client/src/games/` — Game modules. Each game has a directory with `index.js` (metadata + lazy imports), a TV component, and a Phone component. Registry in `registry.js`.

### Adding a New Game

1. Create server module in `server/games/yourGame.js` exporting `{ id, name, description, init, handleAction, onPlayerLeave }`
2. Register it in `server/games/index.js`
3. Create `client/src/games/yourGame/` with:
   - `index.js` — exports `{ id, name, description, TVComponent: lazy(...), PhoneComponent: lazy(...) }`
   - `YourGameTV.jsx` — receives `{ gameState, players }` props
   - `YourGamePhone.jsx` — receives `{ gameState, myId, isHost, players, emit }` props
4. Register in `client/src/games/registry.js`
5. Add to `availableGames` array in registry.js

Games are lazy-loaded — their code is only fetched when selected.

### Communication Pattern

All state flows through a single `session:state` broadcast. Every server-side mutation (player join/leave, game select, game action) ends with `broadcastState()` which emits the full session state to all connected clients. Clients are purely reactive — they render based on the state they receive. The TV connects with `query: { role: 'tv' }`, phones with `query: { role: 'player' }`.
