# Gorillas Game Implementation Plan

## Context

Add a classic QBASIC Gorillas game to the TV party games system. Two players take turns throwing bananas at each other across a city skyline, setting angle and velocity each turn. Wind affects trajectory. First to 3 hits wins. The TV displays the canvas game, phones are the controllers.

## Approach: Server-Authoritative Physics

- Server generates buildings, places gorillas, computes trajectory + collision on each throw
- `lastThrow` in gameState contains throw params (angle, velocity, wind, result) but NOT the full trajectory
- TV recomputes trajectory locally from the same params to animate the banana smoothly
- Physics constants duplicated between server and TV (acceptable — no build system for shared modules)
- Server immediately advances turn/round after computing result; TV animates before rendering the new state

## Files to Create

### 1. `server/games/gorillas.js` — Game module

**Exports:** `{ id: 'gorillas', name, description, init, handleAction, onPlayerLeave }`

**`init(session)`** returns gameState:
- `buildings`: 8-12 buildings spanning 1280px width, random heights (150-450px), random colors from a muted palette
- `gorillas`: player 1 on 2nd building, player 2 on 2nd-to-last building, positioned at center-top
- `turnOrder`: first 2 players from session (others spectate)
- `currentTurnIndex`, `wind` (random ±0.1), `scores`, `pointsToWin: 3`
- `throwId: 0`, `lastThrow: null`, `phase: 'aiming'`, `canvasWidth: 1280`, `canvasHeight: 720`
- If fewer than 2 players: return `{ phase: 'error', message: 'Need at least 2 players' }`

**`handleAction(session, playerId, action)`**:
- `{ type: 'throw', angle, velocity }` — validate it's this player's turn, clamp angle (0-90) and velocity (1-100), run `simulateThrow()`, set `lastThrow` with result, advance turn or score
- `{ type: 'playAgain' }` — host only, re-init the game

**`simulateThrow()`** — step-by-step projectile simulation:
- Canvas coordinates (y=0 top). Constants: `GRAVITY=0.4`, `SCALE=0.4`, `GORILLA_RADIUS=20`
- Player 0 throws right (+vx), player 1 throws left (-vx)
- Each step: `vx += wind`, `vy += GRAVITY`, `x += vx`, `y += vy`
- Check: off-screen → miss, within `GORILLA_RADIUS` of opponent → gorillaHit, inside building rect → buildingHit
- On gorillaHit: increment score, if ≥ pointsToWin → gameOver, else regenerate buildings for new round
- On miss/buildingHit: switch turns, randomize wind

**`onPlayerLeave(session, playerId)`**: If an active player leaves, remaining player wins.

### 2. `public/tv/gorillas.js` — TV canvas renderer

Exposes `window.GorillasTV = { render(container, gameState, players) }`

**Canvas setup**: Create 1280x720 canvas in container on first call. CSS scales to fit.

**Drawing layers**:
1. Sky gradient (dark blue)
2. Buildings (colored rectangles with window grid pattern)
3. Gorillas (simple drawn figures — circle head + rectangle body, orange vs blue per player, name labels)
4. HUD: scores at top, wind arrow indicator, round number
5. During animation: yellow banana circle following trajectory

**Animation system**:
- Track `lastAnimatedThrowId` in closure
- When new throwId detected: snapshot current buildings/gorillas, recompute trajectory from throw params using identical physics, animate banana via `requestAnimationFrame`, show explosion on hit
- After animation completes: render latest gameState (may be new round with new buildings)
- `phase === 'gameOver'`: show winner overlay on canvas

### 3. `public/phone/gorillas.js` — Phone controller

Exposes `window.GorillasPhone = { render(container, gameState, myId, isHost, players, socket) }`

**States**:
- **My turn (aiming)**: Angle slider (0-90°, default 45), velocity slider (1-100, default 50), wind display, "THROW!" button. Emits `game:action { type: 'throw', angle, velocity }`
- **Not my turn**: "Waiting for [name] to throw..." + scores
- **Spectator** (3+ players): "Watching the game" + scores
- **Game over**: Winner announcement. Host sees "Play Again" button → emits `{ type: 'playAgain' }`
- **Error** (< 2 players): Show error message

**DOM stability**: On re-render, check if controls already exist before rebuilding DOM (prevents resetting slider positions mid-drag).

## Files to Modify

### 4. `server/games/index.js`
Add `require('./gorillas')` and register in the Map.

### 5. `public/tv/index.html` (line 45)
Add `<script src="gorillas.js"></script>` before the `tv.js` script tag.

### 6. `public/phone/index.html` (line 46)
Add `<script src="gorillas.js"></script>` before the `phone.js` script tag.

### 7. `public/tv/tv.js` (lines 61-71, the playing state block)
When `state.currentGame.id === 'gorillas'`, call `GorillasTV.render(display, state.gameState, state.players)` instead of the default player list.

### 8. `public/phone/phone.js`
- Add gorillas to `availableGames` array (line 77-79)
- In playing state block (lines 108-119): when gorillas, call `GorillasPhone.render(content, state.gameState, myId, amHost, state.players, socket)`

### 9. `public/tv/tv.css`
Add canvas scaling styles for `#game-display canvas`.

### 10. `public/phone/phone.css`
Add styles for gorillas controls: sliders, throw button, score display, waiting/spectator/gameover views. Match existing color scheme (#e94560 accent, #16213e backgrounds, #1a1a2e body).

## Implementation Order

1. Server game module (`server/games/gorillas.js`) — all game logic
2. Register in game registry (`server/games/index.js`)
3. TV renderer (`public/tv/gorillas.js`) — canvas rendering + animation
4. Phone controller (`public/phone/gorillas.js`) — controls UI
5. Wire up: HTML script tags, tv.js dispatch, phone.js dispatch + availableGames
6. CSS for both TV and phone

## Verification

1. `npm install && node server/index.js`
2. Open `/tv` in one browser tab
3. Open `/phone` in two other tabs, join with both
4. Host selects "Gorillas" — TV shows city skyline with two gorillas, phone shows angle/velocity controls for player 1
5. Throw a banana — TV animates trajectory, turn switches to player 2
6. Score 3 hits — game over screen appears on TV and phones
7. Host clicks "Play Again" — new game starts
8. Test with 3 players — third player sees spectator view
9. Disconnect one active player mid-game — remaining player wins
