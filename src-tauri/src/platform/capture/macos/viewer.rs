use crate::platform::input_monitor::{self, InputEventLine};

use super::keycodes::{
    key_activator, key_activator_name, modifier_down, CGEventGetIntegerValueField, CGEventRef,
    FLAGS_CHANGED, KEY_DOWN, KEY_UP, KEYBOARD_EVENT_AUTOREPEAT, KEYBOARD_EVENT_KEYCODE, LEFT_DOWN,
    LEFT_UP, MOUSE_EVENT_BUTTON_NUMBER, OTHER_DOWN, OTHER_UP, RIGHT_DOWN, RIGHT_UP,
};

pub(crate) fn emit_viewer_event(etype: u32, event: CGEventRef) {
    if !input_monitor::enabled() {
        return;
    }

    const SCROLL_WHEEL: u32 = 22;
    const SCROLL_DELTA_AXIS_1: u32 = 11;
    const SCROLL_DELTA_AXIS_2: u32 = 12;

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
            let name = key_activator_name(code);
            let phase = if etype == KEY_DOWN { "down" } else { "up" };
            let kind = if etype == KEY_DOWN {
                "keyDown".to_string()
            } else {
                "keyUp".to_string()
            };
            let summary = format!("OS · key {name} {phase}");
            (kind, summary)
        }
        FLAGS_CHANGED => {
            let code =
                unsafe { CGEventGetIntegerValueField(event, KEYBOARD_EVENT_KEYCODE) } as u16;
            if let Some((activator, down)) = modifier_down(event) {
                let phase = if down { "down" } else { "up" };
                if let crate::domain::profile::Activator::Key { name } = activator {
                    let summary = format!("OS · flags {name} {phase}");
                    ("flagsChanged".into(), summary)
                } else {
                    return;
                }
            } else {
                let name = key_activator_name(code);
                let summary = format!("OS · flags {name}");
                ("flagsChanged".into(), summary)
            }
        }
        LEFT_DOWN | LEFT_UP | RIGHT_DOWN | RIGHT_UP | OTHER_DOWN | OTHER_UP => {
            let btn =
                unsafe { CGEventGetIntegerValueField(event, MOUSE_EVENT_BUTTON_NUMBER) };
            let (label, phase) = match etype {
                LEFT_DOWN => ("left", "down"),
                LEFT_UP => ("left", "up"),
                RIGHT_DOWN => ("right", "down"),
                RIGHT_UP => ("right", "up"),
                OTHER_DOWN => (
                    if btn == 2 { "middle" } else { "other" },
                    "down",
                ),
                OTHER_UP => (
                    if btn == 2 { "middle" } else { "other" },
                    "up",
                ),
                _ => ("mouse", "event"),
            };
            let btn_suffix = if matches!(etype, OTHER_DOWN | OTHER_UP) && btn != 2 {
                format!(" #{btn}")
            } else {
                String::new()
            };
            let kind = if phase == "down" {
                "mouseDown".to_string()
            } else {
                "mouseUp".to_string()
            };
            let summary = format!("OS · mouse {label}{btn_suffix} {phase}");
            (kind, summary)
        }
        SCROLL_WHEEL => {
            let dy =
                unsafe { CGEventGetIntegerValueField(event, SCROLL_DELTA_AXIS_1) };
            let dx =
                unsafe { CGEventGetIntegerValueField(event, SCROLL_DELTA_AXIS_2) };
            let summary = format!("OS · scroll Δ({dx},{dy})");
            ("scrollWheel".into(), summary)
        }
        _ => {
            if let Some(activator) = (unsafe { key_activator(event) }) {
                if let crate::domain::profile::Activator::Key { name } = activator {
                    let summary = format!("OS · event {etype} · {name}");
                    (format!("cgEvent{etype}"), summary)
                } else {
                    return;
                }
            } else {
                let summary = format!("OS · event type {etype}");
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
    crate::platform::app_bus::emit("input-event", line);
}
