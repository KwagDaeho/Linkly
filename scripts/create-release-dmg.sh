#!/usr/bin/env bash
# GitHub release DMG — same layout as Tauri (large icons, Applications drop link, Finder window).
# Requires `npm run tauri:build` first (generates bundle_dmg.sh + icon.icns under target/.../dmg).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
VERSION="$(node -p "require('${ROOT}/package.json').version")"
APP="${ROOT}/src-tauri/target/release/bundle/macos/Linkly.app"
OUT_DIR="${ROOT}/src-tauri/target/release/bundle/dmg"
BUNDLE_DMG="${OUT_DIR}/bundle_dmg.sh"
VOLICON="${OUT_DIR}/icon.icns"
TAURI_NAME="Linkly_${VERSION}_aarch64.dmg"
OUT="${OUT_DIR}/Linkly-${VERSION}-aarch64.dmg"

if [[ ! -d "$APP" ]]; then
  echo "Missing ${APP}. Run: npm run tauri:build" >&2
  exit 1
fi

if [[ ! -x "$BUNDLE_DMG" ]]; then
  echo "Missing ${BUNDLE_DMG}. Run: npm run tauri:build" >&2
  exit 1
fi

cd "$OUT_DIR"
rm -rf Linkly.app
ditto "$APP" ./Linkly.app

rm -f "$TAURI_NAME" "$OUT" rw.*.dmg

"$BUNDLE_DMG" \
  --volname Linkly \
  --icon Linkly.app 180 170 \
  --app-drop-link 480 170 \
  --window-size 660 400 \
  --hide-extension Linkly.app \
  --volicon "$VOLICON" \
  "$TAURI_NAME" Linkly.app

mv -f "$TAURI_NAME" "$OUT"
echo "Created ${OUT}"
