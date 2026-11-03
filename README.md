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

## Play from your computer

Needs [Docker](https://docs.docker.com/get-docker/) on Linux or macOS.

```bash
./start.sh        # or: npm run play
```

This starts the app and a [Cloudflare quick tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/do-more-with-tunnels/trycloudflare/), opens the display on the public URL, and prints the link for phones (they can be on any network). The first player to join enters the printed host code and becomes host. Ctrl+C stops everything. Anyone with the tunnel URL can reach the game while it runs.

## Other ways to run

```bash
docker compose up --build      # server on :3000 (see docker-compose.yml)
npm run build && npm start     # without Docker, Node 18+ (run npm install in . and client/ first)
npm run dev:server             # development: + npm run dev:client for Vite HMR on :5173
```

Display: `/screen` (log in with an access code) or `/screen/<screen-id>`. Phones: `/`.

## Configuration

Set in `.env` (see `.env.example`); `start.sh` writes its own `.env.local`.

| Variable | Description |
|----------|-------------|
| `USERS` | Access codes and roles. See [docs/access-and-quizzes.md](docs/access-and-quizzes.md) |
| `SCREENS` | Pre-registered display IDs. Same doc |
| `GEMINI_API_KEY` | Optional. Enables AI quiz generation; without it only saved or uploaded quizzes are available |
| `GEMINI_MODEL` | Optional. Defaults to `gemini-2.5-flash` |
| `PORT` | Server port, default `3000` |

## More

- [Access, quizzes and the upload API](docs/access-and-quizzes.md)
- [Development: architecture and adding a game](docs/development.md)

## License

MIT
