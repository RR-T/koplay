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

KoPlay is a JackBox-style party game system. Any monitor with a web browser shows the game and a QR code; players join from their phones. Games: **Gorillas** (artillery), **Acrophobia** (invent funny acronyms, vote for the best) and **Trivia** (saved quizzes, optionally AI-generated).

## Quick start

Needs [Docker](https://docs.docker.com/get-docker/) on Linux or macOS (Windows: use WSL).

```bash
git clone https://github.com/alexanderbailey/koplay.git
cd koplay
./start.sh        # or: npm run play
```

`start.sh` checks Docker, builds and starts everything, and prints the links. There's nothing to configure. Optional settings go in your environment or a `.env` file here: `GEMINI_API_KEY` (AI quiz generation) and `LOCAL_PORT` (default `4747`).

Make your first quiz with the Claude Code skill: run `./start.sh --install-skill` once, then, with KoPlay running, ask Claude something like *"Quiz me on the Roman Empire"* (or run `/koplay-quiz`) and it writes the quiz and puts it on your screen. It only talks to `localhost`, so quiz content never leaves your machine apart from what Claude itself processes.

`start.sh` starts the app plus a [Cloudflare quick tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/do-more-with-tunnels/trycloudflare/) (no account needed), opens the display on its public URL and prints the link for phones, which can be on any network. Phones scan the QR code (or enter the 5-letter game code shown on the screen) and type a name; the first to join becomes host. There are no passwords in local play. Ctrl+C stops everything. Saved quizzes live in `server/data/` on your machine (not in git), so they survive restarts and rebuilds; deleting that folder deletes them. The tunnel only serves the game itself: the upload API is refused through it and is available only on `localhost`. Anyone with the tunnel URL and a live game code can join, and the first to join hosts.

## Other ways to run

```bash
docker compose up --build      # server on :3000 (see docker-compose.yml)
npm run build && npm start     # without Docker, Node 18+ (run npm install in . and client/ first)
npm run dev:server             # development: + npm run dev:client for Vite HMR on :5173
```

Display: `/screen` (log in with an access code) or `/screen/<screen-id>`. Phones: `/`. The 5-letter game code on the display is per game; access codes are server passwords set in `USERS`.

## Configuration

Set in `.env` (see `.env.example`). Local play (`./start.sh`) needs none of these.

| Variable | Description |
|----------|-------------|
| `USERS` | Access codes and roles. See [docs/access-and-quizzes.md](docs/access-and-quizzes.md) |
| `SCREENS` | Pre-registered display IDs. Same doc |
| `GEMINI_API_KEY` | Optional. Enables AI quiz generation; without it only saved or uploaded quizzes are available |
| `GEMINI_MODEL` | Optional. Defaults to `gemini-2.5-flash` |
| `PORT` | Server port, default `3000` |
| `LOCAL_PORT` | Optional override of the local-play host port (default `4747`) |

## More

- [Access, quizzes and the upload API](docs/access-and-quizzes.md)
- [Development: architecture and adding a game](docs/development.md)

## License

MIT
