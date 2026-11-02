#!/usr/bin/env bash
# Remove local Linkly install, user data, login item, and macOS TCC rows.
# Deleting the .app alone does NOT clear Accessibility in System Settings.
set -euo pipefail

BUNDLE="com.kwagdaeho.linkly"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

pkill -x linkly 2>/dev/null || true
osascript -e 'tell application "Linkly" to quit' 2>/dev/null || true
sleep 1

AGENT="$HOME/Library/LaunchAgents/Linkly.plist"
if [[ -f "$AGENT" ]]; then
  launchctl bootout "gui/$(id -u)" "$AGENT" 2>/dev/null || true
  rm -f "$AGENT"
fi

rm -rf "/Applications/Linkly.app"
rm -rf "$HOME/Library/Application Support/linkly"
rm -rf "$HOME/Library/Caches/${BUNDLE}"
rm -rf "$HOME/Library/Caches/linkly"
rm -rf "$HOME/Library/Logs/Linkly"
rm -f "$HOME/Library/Preferences/${BUNDLE}.plist"
rm -rf "$HOME/Library/Saved Application State/${BUNDLE}.savedState"
rm -rf "$HOME/Library/WebKit/${BUNDLE}"

for svc in Accessibility ListenEvent PostEvent; do
  tccutil reset "$svc" "$BUNDLE" 2>/dev/null || true
done

rm -rf "${ROOT}/src-tauri/target" "${ROOT}/dist"
find "$HOME/Downloads" -maxdepth 1 -name 'Linkly*.dmg' -delete 2>/dev/null || true

echo "Linkly local data cleared (including TCC for ${BUNDLE})."
echo "Reinstall from GitHub DMG if needed; grant Accessibility again on first run."
