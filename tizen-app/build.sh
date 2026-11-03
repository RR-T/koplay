#!/usr/bin/env bash
# Build the Samsung Tizen TV wrapper for YOUR KoPlay server.
#
#   KOPLAY_URL=https://your-server.example/screen/local ./build.sh
#
# KOPLAY_URL is the full address the TV should open (a stable URL: a quick
# tunnel URL changes every run, so use your own domain or a named tunnel).
# The result is staged in build/app (gitignored). If the Tizen CLI is installed and
# TIZEN_PROFILE names a signing profile, it is also packaged as a .wgt. Never commit
# the .wgt: it embeds your URL and your signing certificates.
set -euo pipefail
cd "$(dirname "$0")"

URL="${KOPLAY_URL:-${1:-}}"
if [ -z "$URL" ]; then
  echo "Usage: KOPLAY_URL=https://your-server.example/screen/local $0" >&2
  exit 1
fi
case "$URL" in
  http://*|https://*) ;;
  *) echo "KOPLAY_URL must start with http:// or https:// (got: $URL)" >&2; exit 1 ;;
esac
ORIGIN="$(printf '%s' "$URL" | sed -E 's#^(https?://[^/]+).*#\1#')"

esc() { printf '%s' "$1" | sed -e 's/[\\|&]/\\&/g'; }
OUT="build/app"
mkdir -p "$OUT"
cp app.js icon.png "$OUT/"
HTML_URL="$(printf '%s' "$URL" | sed 's/&/\&amp;/g')"   # & must be &amp; inside an HTML attribute
sed -e "s|__KOPLAY_URL__|$(esc "$HTML_URL")|g" index.html > "$OUT/index.html"
sed -e "s|__KOPLAY_ORIGIN__|$(esc "$ORIGIN")|g" config.xml > "$OUT/config.xml"

echo "Staged Tizen app for $URL in tizen-app/$OUT"
if command -v tizen >/dev/null 2>&1 && [ -n "${TIZEN_PROFILE:-}" ]; then
  tizen package -t wgt -s "$TIZEN_PROFILE" -- "$OUT"
  echo "Packaged. Look for the .wgt in tizen-app/$OUT (do not commit it)."
else
  echo "Next: open tizen-app/$OUT in Tizen Studio and build/sign it with your certificate,"
  echo "or set TIZEN_PROFILE and install the Tizen CLI to package it from here."
fi
