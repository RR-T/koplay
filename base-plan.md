# TV Party Games - MVP Plan

## Context

Build a JackBox-style party game system where a Samsung TV displays the game and players join via their phones by scanning a QR code. The server runs on a Raspberry Pi on the LAN at `koplay.example.com`. This MVP focuses on the web server and client pages only (not the Tizen app).

## Tech Stack

- **Server:** Node.js + Express + Socket.IO (3 dependencies total)
- **Frontend:** Vanilla HTML/CSS/JS (no build step, no framework)
- **QR code:** `qrcode` library loaded via CDN on the TV page (client-side generation)
- **No database** - single in-memory session (party games are ephemeral)
- **No Docker** for now - just `node server/index.js`

## How It Works

1. TV loads `/tv` → shows QR code pointing to `{origin}/phone`
2. Phones scan QR → enter name → first to join becomes host
3. Host picks a game (just "Lobby" for now) → TV displays it
4. TV is display-only, phones are the controllers

Single session model (no room codes) — one TV, one Pi, one game at a time.

## Project Structure

```
tv_games/
  package.json
  server/
    index.js              # Express + Socket.IO server
    sessionManager.js     # In-memory session state
    games/
      index.js            # Game registry
      lobby.js            # Lobby "game" - just shows who joined
  public/
    tv/
      index.html
      tv.js
      tv.css
    phone/
      index.html
      phone.js
      phone.css
```

## Server (`server/index.js`)

- Express serves static files from `public/`
- Routes: `GET /tv` → TV page, `GET /phone` → phone page, `GET /` → redirect to `/phone`
- Socket.IO handles real-time communication
- On connection, clients identify via `query: { role: 'tv' | 'player' }`

## Session Manager (`server/sessionManager.js`)

Single session object:
```
{ state: 'waiting'|'lobby'|'playing', hostId, players: Map, currentGame, gameState }
```

- TV connects → joins `"tv"` room, session resets to `waiting`
- Phone emits `player:join { name }` → added to players; first joiner becomes host, state → `lobby`
- Host emits `host:selectGame { gameId }` → game loaded, state → `playing`
- Any state change → full state broadcast to all clients (`session:state` event)
- Disconnect handling: host leaves → promote next player; TV leaves → reset everything

## TV Page (`public/tv/`)

Three visual states driven by `session:state` events:
- **waiting:** Large centered QR code + "Scan to join!"
- **lobby:** QR code shrinks to corner, player list centered, "Waiting for host to pick a game..."
- **playing:** Game-specific display (lobby game = styled player list), QR code stays in corner

QR code URL derived from `window.location.origin + '/phone'` (no hardcoded domain).

## Phone Page (`public/phone/`)

States:
- **Not joined:** Name input + "Join" button
- **Host in lobby:** "You're the host!" + game list + player list
- **Player in lobby:** "Waiting for host..." + player list
- **Playing:** Game-specific phone UI

## Game Plugin Interface (`server/games/`)

Each game exports: `{ id, name, description, init(session), handleAction(session, playerId, action), onPlayerLeave(session, playerId) }`

Registry in `games/index.js` maps IDs to modules. Adding a game = create file + add to registry.

The lobby game has no actions - it just exists to show the player list on the TV.

## Socket.IO Events

| Direction | Event | Payload |
|-----------|-------|---------|
| Server → All | `session:state` | Full session state (players, host, game, etc.) |
| Server → Phone | `error` | `{ message }` |
| Phone → Server | `player:join` | `{ name }` |
| Phone → Server | `host:selectGame` | `{ gameId }` |
| Phone → Server | `game:action` | `{ action, ...data }` (future) |

## Implementation Order

1. Project scaffolding (`package.json`, directory structure)
2. Express server + static file serving + Socket.IO setup
3. Session manager with player/host/game lifecycle
4. Game registry + lobby game module
5. TV page (QR code, state rendering)
6. Phone page (join flow, host/player UI)
7. Styling (clean, readable on TV from couch distance; mobile-friendly on phones)

## Verification

1. Run `node server/index.js`
2. Open `/tv` in a browser → QR code should appear
3. Open `/phone` in another tab → enter name → should become host, TV updates
4. Open `/phone` in a third tab → enter name → joins as regular player
5. Host selects "Lobby" → TV shows lobby game with player list
6. Close host tab → next player promoted to host
7. Close TV tab → all phones notified, session resets
