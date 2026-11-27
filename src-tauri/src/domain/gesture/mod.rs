//! Draw-to-act gestures.
//!
//! The hold activator draws while held; the toggle activator starts drawing on one
//! press and finishes on the next. While drawing the cursor moves normally, the trail
//! is shown on screen, and on finish the stroke is matched against the saved shapes
//! (size and position do not matter — see `recognizer`).
//!
//! While the UI records a new shape, the same keys draw it but the stroke goes back to
//! the UI (`gesture-recorded`) instead of firing a match.

pub mod recognizer;

use std::sync::atomic::{AtomicBool, AtomicU64, Ordering};
use std::sync::LazyLock;
use std::thread;
use std::time::{Duration, Instant};

use parking_lot::Mutex;

use crate::domain::device::{ButtonId, ButtonState};
use crate::domain::profile::{
    Activator, GesturePoint, GestureSettings, MouseClickButton, PointerSettings, Profile,
};
use crate::platform::inject;

const SAMPLE_INTERVAL: Duration = Duration::from_millis(8);
/// HID + CGEvent can both report one physical press; ignore the echo.
const TOGGLE_DEBOUNCE: Duration = Duration::from_millis(80);

const MODIFIER_KEYS: [&str; 12] = [
    "Control", "Option", "Shift", "Meta",
    "LeftControl", "RightControl", "LeftOption", "RightOption",
    "LeftShift", "RightShift", "LeftMeta", "RightMeta",
];

static SETTINGS: LazyLock<Mutex<GestureSettings>> =
    LazyLock::new(|| Mutex::new(GestureSettings::default()));
static POINTER: LazyLock<Mutex<PointerSettings>> =
    LazyLock::new(|| Mutex::new(PointerSettings::default()));
static ENABLED: AtomicBool = AtomicBool::new(false);
static RECORDING: AtomicBool = AtomicBool::new(false);
static DRAWING: AtomicBool = AtomicBool::new(false);
/// Bumped per stroke so a stale sampler thread stops.
static STROKE: AtomicU64 = AtomicU64::new(0);
static POINTS: Mutex<Vec<GesturePoint>> = Mutex::new(Vec::new());
static LAST_TOGGLE_AT: Mutex<Option<Instant>> = Mutex::new(None);

pub fn sync_from_profile(profile: &Profile) {
    let next = profile.gestures.clone();
    let enabled = profile.enabled && next.is_configured();
    let keys_changed = {
        let prev = SETTINGS.lock();
        prev.hold_activator != next.hold_activator || prev.toggle_activator != next.toggle_activator
    };
    *SETTINGS.lock() = next;
    *POINTER.lock() = profile.pointer.clone();
    ENABLED.store(enabled, Ordering::SeqCst);
    if !enabled || keys_changed {
        cancel();
    }
}

pub fn needs_event_watch(profile: &Profile) -> bool {
    (profile.enabled && profile.gestures.is_configured()) || is_recording() || is_drawing()
}

pub fn is_recording() -> bool {
    RECORDING.load(Ordering::SeqCst)
}

/// The draw dialog is open: the gesture keys record a shape for the UI.
pub fn set_recording(active: bool) {
    RECORDING.store(active, Ordering::SeqCst);
    if active {
        crate::platform::capture::ensure_watch_tap();
    } else {
        cancel();
    }
}

/// Keys act when gestures are live, or when recording with a key assigned.
fn armed() -> bool {
    ENABLED.load(Ordering::SeqCst)
        || (is_recording() && SETTINGS.lock().activators().next().is_some())
}

pub fn is_drawing() -> bool {
    DRAWING.load(Ordering::SeqCst)
}

pub fn is_reserved_catalog_button(id: ButtonId) -> bool {
    armed()
        && SETTINGS
            .lock()
            .activators()
            .any(|a| matches!(a, Activator::Device { button } if *button == id))
}

fn matches_hold(activator: &Activator) -> bool {
    SETTINGS
        .lock()
        .hold_activator
        .as_ref()
        .is_some_and(|armed| armed.matches_input(activator))
}

fn matches_toggle(activator: &Activator) -> bool {
    SETTINGS
        .lock()
        .toggle_activator
        .as_ref()
        .is_some_and(|armed| armed.matches_input(activator))
}

fn is_modifier_key(activator: &Activator) -> bool {
    matches!(activator, Activator::Key { name } if MODIFIER_KEYS.contains(&name.as_str()))
}

/// Returns true when the event is consumed (modifiers pass through so the OS keeps
/// its modifier state consistent).
pub fn on_os_down(activator: &Activator, is_repeat: bool) -> bool {
    if !armed() {
        return false;
    }
    let hold = matches_hold(activator);
    let toggle = !hold && matches_toggle(activator);
    if !hold && !toggle {
        return false;
    }
    let swallow = !is_modifier_key(activator);
    if is_repeat {
        return swallow;
    }
    if hold {
        begin();
    } else {
        let now = Instant::now();
        let mut last = LAST_TOGGLE_AT.lock();
        if last.is_some_and(|t| now.duration_since(t) < TOGGLE_DEBOUNCE) {
            return swallow;
        }
        *last = Some(now);
        drop(last);
        if is_drawing() {
            finish();
        } else {
            begin();
        }
    }
    swallow
}

pub fn on_os_up(activator: &Activator, is_repeat: bool) -> bool {
    if !armed() && !is_drawing() {
        return false;
    }
    if matches_hold(activator) {
        if !is_repeat {
            finish();
        }
        return !is_modifier_key(activator);
    }
    matches_toggle(activator) && !is_modifier_key(activator)
}

/// Escape while drawing drops the stroke.
pub fn on_escape() -> bool {
    if !is_drawing() {
        return false;
    }
    cancel();
    true
}

pub fn note_catalog_button_edges(prev: ButtonState, state: ButtonState) {
    for id in state.pressed_edges(prev) {
        on_os_down(&Activator::Device { button: id }, false);
    }
    for id in state.released_edges(prev) {
        on_os_up(&Activator::Device { button: id }, false);
    }
}

/// Linkly's own injected mouse button (e.g. a key remapped to Button 26).
pub fn on_synthetic_mouse(button: &MouseClickButton, down: bool) {
    let activator = Activator::Mouse {
        button: button.clone(),
    };
    if down {
        on_os_down(&activator, false);
    } else {
        on_os_up(&activator, false);
    }
}

fn begin() {
    if DRAWING.swap(true, Ordering::SeqCst) {
        return;
    }
    let stroke = STROKE.fetch_add(1, Ordering::SeqCst) + 1;
    {
        let (x, y) = inject::cursor_location();
        let mut points = POINTS.lock();
        points.clear();
        points.push(GesturePoint { x, y });
    }
    inject::show_gesture_trail();
    inject::track_gesture_trail();
    thread::Builder::new()
        .name("link-gesture".into())
        .spawn(move || {
            while DRAWING.load(Ordering::SeqCst) && STROKE.load(Ordering::SeqCst) == stroke {
                sample();
                thread::sleep(SAMPLE_INTERVAL);
            }
        })
        .ok();
}

fn sample() {
    let (x, y) = inject::cursor_location();
    {
        let mut points = POINTS.lock();
        if points
            .last()
            .is_some_and(|p| (p.x - x).hypot(p.y - y) < 1.0)
        {
            return;
        }
        points.push(GesturePoint { x, y });
    }
    inject::track_gesture_trail();
}

fn finish() {
    if !DRAWING.swap(false, Ordering::SeqCst) {
        return;
    }
    sample_last();
    let stroke = std::mem::take(&mut *POINTS.lock());
    inject::hide_gesture_trail();
    if is_recording() {
        crate::platform::app_bus::emit("gesture-recorded", stroke);
        return;
    }
    // Never inject from the event-tap callback.
    thread::spawn(move || fire_match(&stroke));
}

fn sample_last() {
    let (x, y) = inject::cursor_location();
    POINTS.lock().push(GesturePoint { x, y });
}

fn cancel() {
    if DRAWING.swap(false, Ordering::SeqCst) {
        POINTS.lock().clear();
        inject::hide_gesture_trail();
    }
}

fn fire_match(stroke: &[GesturePoint]) {
    let settings = SETTINGS.lock().clone();
    let Some((index, score)) = recognizer::best_match(
        stroke,
        settings.entries.iter().map(|e| e.template.as_slice()),
    ) else {
        log::debug!("gesture: no match ({} points)", stroke.len());
        return;
    };
    let entry = &settings.entries[index];
    log::debug!("gesture: matched {} (score {score:.2})", entry.id);
    let pointer = POINTER.lock().clone();
    crate::domain::engine::input::fire_one_shot_action(&entry.binding.click, &pointer);
}

pub fn shutdown() {
    ENABLED.store(false, Ordering::SeqCst);
    RECORDING.store(false, Ordering::SeqCst);
    cancel();
}
