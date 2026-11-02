#!/usr/bin/env bash
# Full local wipe: app, data, LaunchAgent, and macOS privacy (TCC) for Linkly.
#
# Note: System Settings may still *list* Linkly under Accessibility after reset;
# the toggle should be OFF. If it stays ON, turn it off manually once, or log out/in.
set -euo pipefail

BUNDLE="com.kwagdaeho.linkly"
LEGACY_BUNDLES=(
  "com.kwagdaeho.elecom-huge"
)
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

/usr/bin/pkill -9 -x linkly 2>/dev/null || true
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

reset_tcc() {
  local id="$1"
  if tccutil reset All "$id" 2>/dev/null; then
    echo "TCC reset All: ${id}"
  fi
  for svc in Accessibility ListenEvent PostEvent; do
    tccutil reset "$svc" "$id" 2>/dev/null || true
  done
}

reset_tcc "$BUNDLE"
for legacy in "${LEGACY_BUNDLES[@]}"; do
  reset_tcc "$legacy" 2>/dev/null || true
done

rm -rf "${ROOT}/src-tauri/target" "${ROOT}/dist"
find "$HOME/Downloads" -maxdepth 1 -name 'Linkly*.dmg' -delete 2>/dev/null || true

while read -r vol; do
  [[ -n "$vol" ]] && hdiutil detach "$vol" -force 2>/dev/null || true
done < <(hdiutil info 2>/dev/null | awk '/\/Volumes\// {print $NF}' | rg '^/Volumes/(Linkly|dmg\.)' || true)

echo ""
echo "Done. Removed app + user data + TCC for ${BUNDLE}."
echo "System Settings → Privacy → Accessibility: Linkly should be OFF or gone."
echo "If the toggle is still ON, switch it off manually (macOS sometimes keeps the row)."
