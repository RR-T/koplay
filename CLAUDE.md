# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

JackBox-style party game system for a shared screen + phone controllers. Any monitor with a browser displays the game, and players join via phones by scanning a QR code. Runs on any machine that can run Node.js or Docker. One room per screen (each with its own 5-letter join code and session), one game at a time per room, all state in-memory. See `server/rooms.js`.

## Commands

- **Run server:** `node server/index.js` (serves on port 3000, configurable via `PORT` env var)
- **Build client:** `npm run build` (runs Vite build in client/)
- **Dev mode:** Run `npm run dev:server` and `npm run dev:client` in separate terminals. Vite dev server on port 5173 proxies Socket.IO to port 3000.
- **Install deps:** `npm install` (server) and `cd client && npm install` (client)
- **Docker:** `docker compose up --build`
- **Gemini is optional:** without `GEMINI_API_KEY`, trivia hides AI generation (`canGenerate` in `server/games/trivia.js`) and only saved quizzes can be picked; `POST /api/quiz` (upload role) works regardless.
- **Local play (laptop + public tunnel):** `./setup.sh` (interactive: writes `.env.local`, pulls images, offers to launch) then `./start.sh` (or `npm run play`; Linux/macOS) — uses `docker-compose.local.yml` (own project name `tv-games-local`, publishes `LOCAL_PORT`, runs a Cloudflare quick tunnel) and a generated gitignored `.env.local`. The production `docker-compose.yml` is separate (Caddy network, `restart: no`).

## Architecture

### Server (Node.js + Express + Socket.IO)

- `server/index.js` — Express app + Socket.IO event wiring. Serves built client from `client/dist/`, handles all socket events, calls into sessionManager and game modules, broadcasts state after every mutation via `io.emit('session:state', ...)`.
- `server/sessionManager.js` — Singleton managing one global session. State machine: `waiting` → `lobby` (first player joins) → `playing` (host selects game). Tracks players (Map keyed by socket ID), host (first joiner, auto-promoted on disconnect), current game, and game state.
- `server/games/index.js` — Game registry (Map of id → game module). To add a game: create a module in `server/games/`, add it to this registry.
- `server/games/lobby.js` — Reference game module. Every game exports: `{ id, name, description, init(session), handleAction(session, playerId, action), onPlayerLeave(session, playerId) }`.

### Client (React + Vite + Tailwind CSS)

Two separate React apps built by Vite with shared code:

- `client/src/tv/` — Display app (`/tv`). Screens: intro video, waiting (QR code), lobby (player list), playing (lazy-loaded game component).
- `client/src/phone/` — Phone controller app (`/phone`, also served at `/`). Screens: join form, waiting, lobby-host (game selector), lobby-player, playing (lazy-loaded game component).
- `client/src/shared/` — Shared React context (SocketContext), hooks (useTimer), and components (Timer, PlayerList, Scoreboard, Rankings, PlayAgainButton, ConfettiCanvas, QRCodeCanvas).
- `client/src/games/` — Game modules. Each game has a directory with `index.js` (metadata + lazy imports), a display (TV) component, and a Phone component. Registry in `registry.js`.

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

### TV Browser Compatibility

The TV client runs on **Samsung Tizen 5.0** — `SamsungBrowser/2.2` based on **Chrome 63** (Chromium 63.0.3239.84). Always write CSS and JS that works in Chrome 63.

**TV user agent:**
```
Mozilla/5.0 (SMART-TV; Linux; Tizen 5.0) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/2.2 Chrome/63.0.329.84 TV Safari/537.36
```

**CSS restrictions — do NOT use these in TV-facing components:**
- `oklch()` / `oklab()` / `color-mix()` — not supported; the Vite build plugin converts Tailwind's built-in oklch tokens to hex at bundle time, but any oklch written directly in JSX `style={}` props or custom CSS will break
- `padding-inline` / `padding-block` / `margin-inline` / `margin-block` and their `-start`/`-end` variants — the build plugin converts Tailwind's `px-*`/`py-*`/`mx-*`/`my-*` classes automatically, but avoid writing these properties by hand
- `inset:` shorthand — converted by the build plugin for Tailwind classes; avoid in inline styles
- `gap` on **flex** containers — not supported until Chrome 84; use `space-x-*`/`space-y-*` Tailwind utilities or explicit margins instead (`gap` on CSS **grid** containers works via the `grid-gap` fallback the plugin emits)
- `aspect-ratio`, `clamp()`, `min()`, `max()` CSS functions — not supported until Chrome 79+
- CSS `scale` property shorthand — not supported until Chrome 104; use `transform: scale()` instead

**JS restrictions:**
- The Vite build target is `chrome63`, so modern JS syntax is transpiled automatically
- Avoid optional chaining (`?.`) and nullish coalescing (`??`) in code paths that run on the TV without verifying they survive the transpile step (they should, but test if in doubt)

**Audio restriction — Tizen 5 can only play one `HTMLAudioElement` at a time.** Playing a second one silently interrupts the first (background music stops when an SFX plays). Always route audio through the shared `AudioContext` in `client/src/shared/sounds.js`:
- **SFX** — call `playSoundById()` or `sound.play()`; these already use `AudioBufferSourceNode` via the shared context.
- **Music** — use `createMusicElement(url, { loop })` (exported from `sounds.js`) instead of `new Audio(url)`. It wraps the `HTMLAudioElement` in `createMediaElementSource()` so it mixes with SFX through the same context.
- Never use `new Audio()` directly for TV-side playback.

**Build plugin** (`client/vite.config.js` → `unwrapCSSLayers`): post-processes the built CSS bundle to patch Tailwind v4 output for Chrome 63 — converts oklch to hex, logical properties to physical, adds `grid-gap` fallbacks, and fixes `inset:` shorthand. Phone clients are served from the same bundle but run on modern mobile browsers, so these conversions are harmless there.

### Communication Pattern

All state flows through a single `session:state` broadcast. Every server-side mutation (player join/leave, game select, game action) ends with `broadcastState()` which emits the full session state to all connected clients. Clients are purely reactive — they render based on the state they receive. The display connects with `query: { role: 'tv' }`, phones with `query: { role: 'player' }`.
