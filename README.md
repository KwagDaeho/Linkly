# Linkly

> **Linkly** is a macOS menu bar app that **links** keyboard keys, mouse buttons, and device-specific controls to the actions you choose — clicks, keys, scroll, macros, and app shortcuts.

Supported languages: **English / Korean** · 지원 언어: **한국어 / English**

[![Download for macOS](https://img.shields.io/badge/Download-macOS%20DMG%20(v2.0.4)-0A7EA4?style=for-the-badge&logo=apple&logoColor=white)](https://github.com/KwagDaeho/Linkly/releases/download/v2.0.4/Linkly-2.0.4-aarch64.dmg)
[![All releases](https://img.shields.io/badge/Releases-GitHub-181717?style=for-the-badge&logo=github)](https://github.com/KwagDaeho/Linkly/releases/latest)

Email: [1438eogh@gmail.com](mailto:1438eogh@gmail.com) · Kakao: [open.kakao.com/me/Theo_Kwag](https://open.kakao.com/me/Theo_Kwag) · GitHub: [KwagDaeho/Linkly](https://github.com/KwagDaeho/Linkly)

---

## Product direction

Linkly is becoming a **general-purpose input remapper** for macOS, not a single-device utility.

| Area | Goal |
|------|------|
| **Common** | Mappings that apply broadly: button/key remaps, modifier chords, macros, pointer & scroll tuning (including invert). |
| **Trackball** | Device-specific features grouped in the UI (accordion): e.g. scroll-by-ball with toggle/hold activators on any key or mouse button. |
| **Devices** | Catalog trackballs with raw HID side buttons (Fn1–Fn3 on supported models). More devices over time. |

Linkly is independent third-party software. Device support uses public HID behavior only.

---

<a id="en"></a>

## English

### About

Linkly runs in the **menu bar**, reads keyboard, mouse, and catalog HID buttons macOS may not expose, and applies your profile while it is running. Closing the window keeps the app alive in the tray.

### Features (v2.0.4)

Current public builds still ship under the legacy app name on disk; functionally they include:

| Area | What you can do |
|------|-----------------|
| **Common — button mapping** | Remap Left / Right / Middle / Fn1–3 to clicks, keys, scroll, tilt, long-press, auto-click, open app, or macro |
| **Common — custom mapping** | Modifier + device button chords (e.g. ⌘ + Left) with isolated keystrokes |
| **Common — pointer & scroll** | Move/scroll speed, scroll direction toggles |
| **Per-keyboard triggers** | Give one keyboard its own single triggers (e.g. a left-hand keypad); modifiers held on one keyboard apply to another |
| **Gesture triggers** | Draw a shape with the cursor using a hold/toggle key; the matching shape's action runs (any size or position) |
| **Trackball — ball scroll** | While a toggle/hold activator is active, ball motion becomes scroll; invert axes and tune speed |
| **System** | Menu bar tray, launch at login, Korean/English UI, light/dark theme, custom accent color |

### Architecture (macOS)

- **React + Tauri** — profile editor, mapping UI, i18n
- **Rust runtime** — HID worker thread, OS event tap for activators, shared-pointer click suppression (Dock-friendly)
- **Low idle cost** — when remapping is off or the device is unplugged, the worker sleeps and re-enumerates HID periodically

### Requirements

- macOS 12+ (Monterey or later)
- Supported catalog models: wired `M-HT1URBK` or wireless dongle `M-HT1DRBK` (056e:010c / 010d family)
- GitHub DMG (v2.0.4): Apple Silicon (M1+)
- From source: Node 20+, Rust (stable)

### Coverage (v2.0.4)

| | v2.0.4 DMG | From source |
|---|:---:|:---:|
| Apple Silicon, macOS 12+ | ✓ | ✓ |
| Intel Mac, macOS 12+ | — | ✓ |
| macOS 11 and older | — | — |
| Extended catalog models, Bluetooth variants | — | — |

- **Accessibility** required · macOS 15+ may also need **Input Monitoring**
- Unsigned builds: **System Settings → Privacy & Security → Open Anyway** (15+)

### Install (released DMG)

1. Download the [macOS DMG](https://github.com/KwagDaeho/Linkly/releases/latest/download/Linkly-2.0.4-aarch64.dmg).
2. Open the DMG and drag the app to **Applications**.
3. Grant **Accessibility** (and **Input Monitoring** if prompted) from the **Info** tab.
4. From 2.0 on, Linkly offers updates in-app (banner → **Update**); permissions stay granted. Coming from 1.x, install 2.0 manually once and grant permissions again.

```bash
tccutil reset Accessibility com.kwagdaeho.linkly
```

### Build from source (Linkly)

```bash
git clone https://github.com/KwagDaeho/Linkly.git
cd Linkly

export PATH="/opt/homebrew/bin:$HOME/.cargo/bin:$PATH"
npm install
npm run tauri:build
```

Output: `src-tauri/target/release/bundle/macos/Linkly.app`

```bash
cp -R "src-tauri/target/release/bundle/macos/Linkly.app" /Applications/
open "/Applications/Linkly.app"
```

Intel Mac:

```bash
rustup target add x86_64-apple-darwin
npx tauri build --target x86_64-apple-darwin
```

### Develop

```bash
npm install
npm run tauri:dev
npm test && npm run build
```

### License

MIT — see [LICENSE](./LICENSE).

---

<a id="ko"></a>

## 한국어

### 소개

**Linkly**는 macOS **메뉴 바**에서 동작하는 입력 리매퍼입니다. 키·마우스·카탈로그 HID 버튼(Fn1–3 등)을 원하는 동작(클릭, 키, 스크롤, 매크로, 앱 실행)에 **연결**합니다.

### 기능 (v2.0.4)

공개 DMG는 아직 예전 앱 이름으로 배포됩니다. 포함 기능:

| 영역 | 설명 |
|------|------|
| **Common — 버튼 매핑** | Left / Right / Middle / Fn1–3 → 클릭, 키, 스크롤, 틸트, 롱프레스, 오토클릭, 앱 열기, 매크로 |
| **Common — 커스텀 매핑** | 수정키 + 디바이스 버튼 조합 (예: ⌘ + Left) |
| **Common — 포인터·스크롤** | 이동/스크롤 속도, 스크롤 방향 |
| **키보드별 트리거** | 특정 키보드에만 단일 트리거 적용 (예: 왼손 키보드), 한 키보드의 수정키를 다른 키보드 입력에도 적용 |
| **제스처 트리거** | 홀딩/토글키로 커서로 모양을 그리면 가장 비슷한 모양의 동작 실행 (크기·위치 무관) |
| **Trackball — 볼 스크롤** | 토글/홀드 활성키 동안 볼 움직임을 스크롤로 변환 |
| **시스템** | 메뉴 바, 로그인 시 실행, 한/영 UI, 테마, 포인트 색상 |

### 요구 사항 · 지원 범위

위 **English** 섹션의 Requirements / Coverage와 동일합니다.

### 설치 · 빌드 · 개발

- DMG: [릴리즈](https://github.com/KwagDaeho/Linkly/releases/latest) *(다음 Linkly 브랜드 릴리즈 전까지 파일명은 legacy)*  
- 소스 빌드 결과: **`Linkly.app`** — English 섹션의 명령 참고  
- 권한 재설정: `tccutil reset Accessibility com.kwagdaeho.linkly`
- 2.0부터는 앱 안에서 업데이트 알림 → **업데이트** 버튼으로 설치되며 권한이 유지됩니다. 1.x에서 올 때만 한 번 수동 설치 후 권한을 다시 허용하세요.

### 라이선스

MIT — [LICENSE](./LICENSE)
