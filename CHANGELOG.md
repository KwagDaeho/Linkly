# Changelog

All notable changes to this project are documented here.

## [1.5.0] — 2026-11-02

### Fixed

- **Permission setup (System tab)** — restore pre–Linkly UI: steps 1–4, Accessibility / Input Monitoring ON·OFF, «Grant access» + «Open System Settings»; no TCC reset on every grant click.
- **Local cleanup** — `clean-local-linkly.sh` resets TCC (`All` + services), LaunchAgent, and app data (not just Application Support).

### Changed

- **`tauri dev`** — permission panel always visible for QA (same copy as release); no auto relaunch in dev so the window stays open while testing.

## [1.4.5] — 2026-11-02

### Fixed

- **Accessibility grant** — relaunch after permission no longer hangs on “restarting”; exit on the main thread and spawn a new instance after the instance lock is released (1.4.4 `request_restart` from IPC did not exit menu-bar apps).
- **Permission UI** — «Retry restart» if auto relaunch fails; clearer failure toast.

### Added

- **`scripts/clean-local-linkly.sh`** — remove app data, LaunchAgent, and macOS TCC rows for a true local reset.

## [1.4.4] — 2026-11-02

### Fixed

- **Accessibility permission** — use Tauri `request_restart` after grant; show toast and “restarting” copy instead of hiding the panel while the process relaunches; stop resetting TCC on every «Grant access» click.
- **Release DMG** — `npm run release:dmg` builds installer layout (large icons, Applications drop link) via Tauri’s `bundle_dmg.sh`.

## [1.4.3] — 2026-11-02

### Changed

- **Main tabs** — order is System, Trigger, Mouse; default tab is System.
- **System tab** — accessibility permission block at the top (always visible when required, no accordion); panel styling matches General and Event viewer sections.

## [1.4.2] — 2026-11-02

### Fixed

- **macOS About** — remove `CFBundleGetInfoString` marketing line; panel shows name, version, and copyright only.
- **App info (System tab)** — align footer block with other sections via `staticSectionBody` indent.
- **GitHub About** — repository description no longer mentions legacy vendor names.
- **Menu bar About** — minimal Linkly About panel (name, version, copyright); neutral bundle/Cargo descriptions.

## [1.4.1] — 2026-11-02

### Changed

- **Branding & storage** — drop legacy ELECOM/HUGE naming, config migration, and old root assets; profiles live under `~/Library/Application Support/linkly/` only.
- **About** — macOS About panel via bundled `Info.plist`; app info block without tagline; contact spacing and Linkly mark bottom-aligned with the GitHub row.
- **Trigger tab** — remove redundant “Common” heading; long-press and mapping accordions start the tab.
- **Mouse tab** — one section group so the divider between pointer scroll and ball scroll matches other tab accent lines.

### Fixed

- **Docs** — changelog and README use neutral Linkly/device wording (no legacy vendor strings).

## [1.4.0] — 2026-11-02

### Added

- **Linkly** — macOS input remapper (`com.kwagdaeho.linkly`).
- **Input event viewer** — live HID/OS event stream in a dedicated window.
- **Device linking** — per-device trigger profiles with scoped overrides and duplicate-trigger guard + toast.
- **Custom combos & hold-chord capture** — OS trigger activators, mapping triggers, and improved capture UX.
- **Connected devices** — list peripherals with link state and transport (wired / RF).

### Changed

- **Shell** — three main tabs (Trigger / Mouse / System) with horizontal swipe transitions and per-tab scroll.
- **Labels** — physical buttons shown as LB / RB in the UI; `ButtonId` serde keys unchanged.
- **Profiles** — stored under `~/Library/Application Support/linkly/`.
- **Performance** — removes RF probe from the HID hot path; throttles device scans; OS trigger dispatch and event emit off worker threads.
- **Docs** — README download links and badges follow `package.json` version via `npm run version:sync`.

### Fixed

- **Fn → synthetic clicks** — pulse down/up for hidden Fn buttons; synthetic mouse posts at Session in shared pointer mode.
- **Input latency** — faster remaps and event viewer updates after worker/dispatch changes.
- **UI** — toast provider crash on duplicate trigger; tab overflow timing during transitions.

## [1.3.2] — 2026-08-24

### Fixed

- **Intermittent quit/crash** — CGEvent tap paths no longer panic when `CGEventSource` creation fails; inject is skipped instead.
- **Key-capture tap** — re-enable after macOS disables the tap (timeout); runloop source failure no longer panics the thread.
- **HID worker** — panic is caught and logged instead of silently killing the remapper thread.

### Changed

- **Diagnostics** — Rust panics append to `~/Library/Logs/Linkly/rust-panic.log` (Linkly builds; legacy DMG used `Linkly Catalog Custom`).

## [1.3.1] — 2026-08-21

### Fixed

- **Gesture profile sync** — HID worker inner loop now refreshes gesture mappings and OS event watch like the outer reconnect loop.
- **Gesture shutdown** — pinned cursor is restored on app exit when a gesture session is active.

### Changed

- **README** — feature tables, architecture/performance notes, and v1.3.1 download links (EN/KO).
- **Editor components** — split into feature subdirs (`macro/`, `gesture/`, `openApp/`, …), shared activator modal, extracted drag/canvas hooks.
- **Rust** — `domain/watch.rs` consolidates OS event tap predicate; removed unused gesture HID helpers.

## [1.3.0] — 2026-08-20

### Added

- **Gesture mapping** — draw custom paths on a canvas recorder and bind them to actions; template thumbnails in the mapping list.
- **Runtime gesture matching** — direction-aware shape checks and Unistroke-style scoring on the Rust side with TS parity tests.

### Fixed

- **Gesture UX** — tighter shape matching, cursor restore after short holds, mapping UI spacing, and trackpad/text-selection quirks during recording.

### Changed

- **Gesture / profile domains** — modular geometry, match, template, canvas, and recorder layers with shared constants.
- **UI styling** — Vanilla Extract co-located styles per component; shared `Modal`, `Panel`, and layout primitives replace legacy global CSS.
- **i18n** — locale and format helpers reorganized under `src/i18n/`.
- **README** — contact, language, and doc jump links formatted by row.

## [1.2.1] — 2026-08-19

### Added

- **Macro editor** — drag-to-reorder steps with pointer-based sorting; popup prompts for adding/editing keys and delays; edit button per step; overlay scrollbar on the step list.

### Fixed

- **Custom mapping chords** — modifier + device button combos no longer leak OS default clicks; chord keystrokes are isolated so Spotlight and foreground apps are not polluted.

### Changed

- **Contact SSOT** — email, Kakao, and GitHub links centralized in `src/meta/app.json`; footer order Email → Kakao → GitHub; README EN section first.
- **Frontend structure** — types, domain, and mapping UI reorganized with barrel exports; hooks/providers replace legacy context; `export const` style codemod.
- **Rust structure** — domain profile/custom_mapping/engine, platform capture, and ball-scroll runtime split into focused modules (same layout philosophy as the FE refactor).
- **UI** — overlay scrollbar idle fade; disabled long-press select styling.

## [1.2.0]

See [release v1.2.0](https://github.com/KwagDaeho/Linkly/releases/tag/v1.2.0).
