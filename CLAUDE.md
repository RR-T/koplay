# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

JackBox-style party game system for Samsung TV + phone controllers. A TV displays the game, players join via phones by scanning a QR code. Runs on a Raspberry Pi on the LAN. Single session model — no room codes, one game at a time, all state in-memory.

## Commands

- **Run server:** `node server/index.js` (serves on port 3000, configurable via `PORT` env var)
- **Install deps:** `npm install`
- **Docker:** `docker compose up --build`

No build step, no tests, no linter currently configured.

## Architecture

### Server (Node.js + Express + Socket.IO)

- `server/index.js` — Express app + Socket.IO event wiring. Serves static files, handles all socket events, calls into sessionManager and game modules, broadcasts state after every mutation via `io.emit('session:state', ...)`.
- `server/sessionManager.js` — Singleton managing one global session. State machine: `waiting` → `lobby` (first player joins) → `playing` (host selects game). Tracks players (Map keyed by socket ID), host (first joiner, auto-promoted on disconnect), current game, and game state.
- `server/games/index.js` — Game registry (Map of id → game module). To add a game: create a module in `server/games/`, add it to this registry.
- `server/games/lobby.js` — Reference game module. Every game exports: `{ id, name, description, init(session), handleAction(session, playerId, action), onPlayerLeave(session, playerId) }`.

### Client (Vanilla HTML/CSS/JS, no framework, no build)

- `public/tv/` — TV display page (`/tv`). Screen-based rendering driven by `session:state` events. Three screens: waiting (QR code), lobby (player list + small QR), playing (game display). QR code generated client-side via `qrcode.min.js` (bundled).
- `public/phone/` — Phone controller page (`/phone`, also served at `/`). Five screens: join form, waiting, lobby-host (with game selector), lobby-player, playing. Identifies as `role: 'player'` via Socket.IO query param.

### Communication Pattern

All state flows through a single `session:state` broadcast. Every server-side mutation (player join/leave, game select, game action) ends with `broadcastState()` which emits the full session state to all connected clients. Clients are purely reactive — they render based on the state they receive. The TV connects with `query: { role: 'tv' }`, phones with `query: { role: 'player' }`.
