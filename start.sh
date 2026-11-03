#!/usr/bin/env bash
# One-command local play: starts KoPlay + a public tunnel, opens the display.
# Requires Docker (Linux / macOS). Stop with Ctrl+C.
#
#   ./start.sh                  start KoPlay (offers to install the Claude skill first)
#   ./start.sh --install-skill  install the Claude Code quiz skill, then exit
#
# Optional settings (environment variables, or a .env file in this folder):
#   GEMINI_API_KEY   enable AI quiz generation inside KoPlay
#   LOCAL_PORT       host port (default 4747)
#   LOCAL_USER       name shown as creator of saved quizzes (default Host)
set -euo pipefail
cd "$(dirname "$0")"

COMPOSE="docker compose -f docker-compose.local.yml"
SKILL_SRC="skills/koplay-quiz/SKILL.md"
SKILL_DST="${CLAUDE_SKILLS_DIR:-$HOME/.claude/skills}/koplay-quiz"

install_skill() {
  [ -f "$SKILL_SRC" ] || { echo "Missing $SKILL_SRC"; return 1; }
  mkdir -p "$SKILL_DST"
  local esc
  esc="$(printf '%s' "$PWD" | sed -e 's/[\\|&]/\\&/g')"
  sed "s|__KOPLAY_DIR__|$esc|g" "$SKILL_SRC" > "$SKILL_DST/SKILL.md"
  echo "Installed the Claude Code skill to $SKILL_DST"
  echo "Once KoPlay is running, ask Claude e.g. \"Quiz me on the Roman Empire\"."
}

if [ "${1:-}" = "--install-skill" ]; then install_skill; exit $?; fi

command -v docker >/dev/null || {
  echo "Docker is required but was not found."
  case "$(uname -s)" in
    Darwin) echo "Install Docker Desktop: https://docs.docker.com/desktop/setup/install/mac-install/" ;;
    *)      echo "Install Docker Engine: https://docs.docker.com/engine/install/" ;;
  esac
  exit 1
}
docker info >/dev/null 2>&1 || { echo "Docker is installed but not running (or your user can't access it). Start Docker and try again."; exit 1; }
docker compose version >/dev/null 2>&1 || { echo "The 'docker compose' plugin is required: https://docs.docker.com/compose/install/"; exit 1; }

# Offer the Claude Code quiz skill (skipped once it is installed). Asked up front so you
# can answer before the first build starts. No input / end of input counts as "no".
if [ ! -f "$SKILL_DST/SKILL.md" ] && [ -f "$SKILL_SRC" ]; then
  echo
  echo "KoPlay has a Claude Code skill: ask Claude e.g. \"Quiz me on the Roman Empire\" and it"
  echo "writes the quiz and puts it on your screen. It only talks to localhost."
  read -r -p "Install it to $SKILL_DST? [Y/n]: " ans || ans="n"
  case "${ans:-Y}" in
    [Yy]*) install_skill ;;
    *)     echo "Skipped. You can install it later with: ./start.sh --install-skill" ;;
  esac
  echo
fi

# Port: environment, then .env, then 4747. Exported so docker compose uses the same value.
if [ -z "${LOCAL_PORT:-}" ] && [ -f .env ]; then
  LOCAL_PORT="$(sed -n 's/^LOCAL_PORT=\([0-9]*\).*/\1/p' .env | head -1)"
fi
export LOCAL_PORT="${LOCAL_PORT:-4747}"

cleanup() { echo; echo "Stopping..."; $COMPOSE down >/dev/null 2>&1 || true; }
trap cleanup EXIT
trap 'exit 0' INT TERM

echo "Starting KoPlay (first run builds the image, this can take a few minutes)..."
$COMPOSE up --build -d

echo "Waiting for the public tunnel URL..."
URL=""
for _ in $(seq 1 60); do
  URL="$($COMPOSE logs tunnel 2>&1 | grep -oE 'https://[a-z0-9-]+\.trycloudflare\.com' | head -1 || true)"
  [ -n "$URL" ] && break
  sleep 1
done
[ -n "$URL" ] || { echo "Tunnel did not start. Logs:"; $COMPOSE logs tunnel | tail -20; exit 1; }

echo "Waiting for the app..."
for _ in $(seq 1 30); do
  curl -fs -o /dev/null "http://localhost:$LOCAL_PORT/" && break
  sleep 1
done

DISPLAY_URL="$URL/screen/local"
echo
if [ -f "$SKILL_DST/SKILL.md" ]; then
  echo "  First time? Ask Claude to make your first quiz, e.g. in Claude Code:"
  echo "      \"Quiz me on the Roman Empire\"   (or run /koplay-quiz)"
fi
echo
echo "  Display (open on the big screen):  $DISPLAY_URL"
echo "  Phones join at:                    $URL"
echo "  Local API (no password, localhost only): http://localhost:$LOCAL_PORT/api/quiz"
echo
echo "Press Ctrl+C to stop."

if command -v open >/dev/null; then open "$DISPLAY_URL"
elif command -v xdg-open >/dev/null; then xdg-open "$DISPLAY_URL" >/dev/null 2>&1 || true
fi

# Run in the background and wait, so signals (Ctrl+C or kill) trigger cleanup immediately.
$COMPOSE logs -f app &
wait $!
