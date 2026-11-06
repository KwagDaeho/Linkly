#!/bin/zsh
# Dev Linkly physical footprint soak (target/debug/linkly).
# Usage: scripts/dev-memory-soak.sh [minutes] [interval_sec]

set -uo pipefail

MINUTES=${1:-20}
INTERVAL=${2:-30}
LOG="${REPO_ROOT:-$(cd "$(dirname "$0")/.." && pwd)}/.memory-soak-dev.log"

pid=$(pgrep -f 'target/debug/linkly' | head -1)
if [[ -z "$pid" ]]; then
  echo "no target/debug/linkly — start: npm run tauri:dev" >&2
  exit 1
fi

samples=$(( (MINUTES * 60) / INTERVAL ))
echo "# soak pid=$pid minutes=$MINUTES interval=${INTERVAL}s samples=$samples" | tee -a "$LOG"
echo "# started $(date '+%Y-%m-%d %H:%M:%S')" | tee -a "$LOG"

i=0
while (( i < samples )); do
  if ! kill -0 "$pid" 2>/dev/null; then
    echo "$(date '+%H:%M:%S') EXIT pid=$pid gone" | tee -a "$LOG"
    exit 2
  fi
  line=$(sample "$pid" 1 2>/dev/null | rg 'Physical footprint:' | head -1)
  etime=$(ps -p "$pid" -o etime= 2>/dev/null | tr -d ' ')
  rss=$(ps -p "$pid" -o rss= 2>/dev/null | tr -d ' ')
  echo "$(date '+%H:%M:%S') etime=$etime rss_kb=$rss $line" | tee -a "$LOG"
  i=$(( i + 1 ))
  sleep "$INTERVAL"
done

echo "# finished $(date '+%Y-%m-%d %H:%M:%S')" | tee -a "$LOG"
