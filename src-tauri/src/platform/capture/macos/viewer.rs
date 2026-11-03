use std::sync::atomic::{AtomicU64, Ordering};

use crate::domain::modifier;
use crate::platform::input_monitor::{self, InputEventLine};

use super::keycodes::{
    key_activator, key_activator_name, modifier_down, CGEventGetIntegerValueField, CGEventRef,
    FLAGS_CHANGED, KEY_DOWN, KEY_UP, KEYBOARD_EVENT_AUTOREPEAT, KEYBOARD_EVENT_KEYCODE, LEFT_DOWN,
    LEFT_UP, MOUSE_EVENT_BUTTON_NUMBER, OTHER_DOWN, OTHER_UP, RIGHT_DOWN, RIGHT_UP,
};

static LAST_CURSOR_EMIT_MS: AtomicU64 = AtomicU64::new(0);
const CURSOR_MIN_INTERVAL_MS: u64 = 50;

#[repr(C)]
struct CGPoint {
    x: f64,
    y: f64,
}

#[link(name = "CoreGraphics", kind = "framework")]
extern "C" {
    fn CGEventGetLocation(event: CGEventRef) -> CGPoint;
}

fn key_display_name(code: u16) -> String {
    modifier::side_name_from_keycode(code)
        .map(str::to_string)
        .unwrap_or_else(|| key_activator_name(code))
}

fn should_emit_cursor(ts_ms: u128) -> bool {
    let now = ts_ms as u64;
    let prev = LAST_CURSOR_EMIT_MS.load(Ordering::Relaxed);
    if now.saturating_sub(prev) < CURSOR_MIN_INTERVAL_MS {
        return false;
    }
    LAST_CURSOR_EMIT_MS.store(now, Ordering::Relaxed);
    true
}

pub(crate) fn emit_viewer_event(etype: u32, event: CGEventRef) {
    if !input_monitor::enabled() {
        return;
    }

    const SCROLL_WHEEL: u32 = 22;
    const SCROLL_DELTA_AXIS_1: u32 = 11;
    const SCROLL_DELTA_AXIS_2: u32 = 12;
    const MOUSE_MOVED: u32 = 5;
    const LEFT_MOUSE_DRAGGED: u32 = 6;
    const RIGHT_MOUSE_DRAGGED: u32 = 7;
    const OTHER_MOUSE_DRAGGED: u32 = 27;

    let ts_ms = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_millis())
        .unwrap_or(0);

    let (kind, summary) = match etype {
        KEY_DOWN | KEY_UP => {
            let autorepeat =
                unsafe { CGEventGetIntegerValueField(event, KEYBOARD_EVENT_AUTOREPEAT) } != 0;
            if autorepeat && etype == KEY_DOWN {
                return;
            }
            let code =
                unsafe { CGEventGetIntegerValueField(event, KEYBOARD_EVENT_KEYCODE) } as u16;
            let name = key_display_name(code);
            let phase = if etype == KEY_DOWN { "down" } else { "up" };
            let kind = if etype == KEY_DOWN {
                "keyDown".to_string()
            } else {
                "keyUp".to_string()
            };
            let prefix = if modifier::is_modifier_name(&name) {
                "mod"
            } else {
                "key"
            };
            let summary = format!("{prefix} {name} {phase}");
            (kind, summary)
        }
        FLAGS_CHANGED => {
            if let Some((activator, down)) = modifier_down(event) {
                let phase = if down { "down" } else { "up" };
                if let crate::domain::profile::Activator::Key { name } = activator {
                    let summary = format!("mod {name} {phase}");
                    ("flagsChanged".into(), summary)
                } else {
                    return;
                }
            } else {
                let code =
                    unsafe { CGEventGetIntegerValueField(event, KEYBOARD_EVENT_KEYCODE) } as u16;
                let name = key_display_name(code);
                let summary = format!("mod {name}");
                ("flagsChanged".into(), summary)
            }
        }
        LEFT_DOWN | LEFT_UP | RIGHT_DOWN | RIGHT_UP | OTHER_DOWN | OTHER_UP => {
            let btn =
                unsafe { CGEventGetIntegerValueField(event, MOUSE_EVENT_BUTTON_NUMBER) };
            let down = matches!(etype, LEFT_DOWN | RIGHT_DOWN | OTHER_DOWN);
            let phase = if down { "down" } else { "up" };
            let kind = if down {
                "mouseDown".to_string()
            } else {
                "mouseUp".to_string()
            };
            let summary = match etype {
                LEFT_DOWN | LEFT_UP => format!("mouse left {phase}"),
                RIGHT_DOWN | RIGHT_UP => format!("mouse right {phase}"),
                OTHER_DOWN | OTHER_UP => match btn {
                    2 => format!("mouse middle {phase}"),
                    3 => format!("mouse back {phase}"),
                    4 => format!("mouse forward {phase}"),
                    n if n >= 0 => format!("Button {} {phase}", n + 1),
                    _ => format!("mouse other {phase}"),
                },
                _ => format!("mouse event {phase}"),
            };
            (kind, summary)
        }
        MOUSE_MOVED | LEFT_MOUSE_DRAGGED | RIGHT_MOUSE_DRAGGED | OTHER_MOUSE_DRAGGED => {
            if !should_emit_cursor(ts_ms) {
                return;
            }
            let loc = unsafe { CGEventGetLocation(event) };
            let summary = format!("cursor ({:.0},{:.0})", loc.x, loc.y);
            ("mouseMoved".into(), summary)
        }
        SCROLL_WHEEL => {
            let dy =
                unsafe { CGEventGetIntegerValueField(event, SCROLL_DELTA_AXIS_1) };
            let dx =
                unsafe { CGEventGetIntegerValueField(event, SCROLL_DELTA_AXIS_2) };
            let summary = format!("scroll Δ({dx},{dy})");
            ("scrollWheel".into(), summary)
        }
        _ => {
            if let Some(activator) = (unsafe { key_activator(event) }) {
                if let crate::domain::profile::Activator::Key { name } = activator {
                    let summary = format!("event {etype} · {name}");
                    (format!("cgEvent{etype}"), summary)
                } else {
                    return;
                }
            } else {
                let summary = format!("event type {etype}");
                (format!("cgEvent{etype}"), summary)
            }
        }
    };

    let line = InputEventLine {
        ts_ms,
        source: "os",
        kind,
        summary: summary.clone(),
        detail: summary,
    };
    input_monitor::publish(line);
}
