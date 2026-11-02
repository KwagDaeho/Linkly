//! Live input event stream for the Info-tab event viewer (Karabiner-style).

use std::sync::atomic::{AtomicBool, AtomicU64, Ordering};
use std::sync::mpsc::{sync_channel, TrySendError};
use std::sync::LazyLock;
use std::thread;

use serde::Serialize;

use crate::domain::engine::LastReport;
use crate::domain::profile::{Activator, MouseClickButton};
use crate::platform::app_bus;

static EMIT_TX: LazyLock<std::sync::mpsc::SyncSender<InputEventLine>> = LazyLock::new(|| {
    let (tx, rx) = sync_channel(512);
    thread::Builder::new()
        .name("input-event-emit".into())
        .spawn(move || {
            while let Ok(line) = rx.recv() {
                app_bus::emit("input-event", line);
            }
        })
        .expect("spawn input-event-emit");
    tx
});

static ENABLED: AtomicBool = AtomicBool::new(false);
static VIEWER_KEYBOARD: AtomicBool = AtomicBool::new(false);
static VIEWER_MOUSE: AtomicBool = AtomicBool::new(false);
static LAST_MOTION_EMIT_MS: AtomicU64 = AtomicU64::new(0);
static LAST_VENDOR_EMIT_MS: AtomicU64 = AtomicU64::new(0);

const MOTION_MIN_INTERVAL_MS: u64 = 66;
const VENDOR_MIN_INTERVAL_MS: u64 = 250;

fn throttle_ms(last: &AtomicU64, ts_ms: u128, min_interval_ms: u64) -> bool {
    let now = ts_ms as u64;
    let prev = last.load(Ordering::Relaxed);
    if now.saturating_sub(prev) < min_interval_ms {
        return false;
    }
    last.store(now, Ordering::Relaxed);
    true
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct InputEventLine {
    pub ts_ms: u128,
    pub source: &'static str,
    pub kind: String,
    pub summary: String,
    pub detail: String,
}

fn sync_enabled_from_viewers() {
    let on = VIEWER_KEYBOARD.load(Ordering::SeqCst) || VIEWER_MOUSE.load(Ordering::SeqCst);
    ENABLED.store(on, Ordering::SeqCst);
    if on {
        crate::platform::capture::ensure_watch_tap();
    }
}

pub fn set_enabled(on: bool) {
    ENABLED.store(on, Ordering::SeqCst);
    if on {
        crate::platform::capture::ensure_watch_tap();
    }
}

pub fn set_viewer_channel(channel: &str, on: bool) {
    match channel {
        "keyboard" => VIEWER_KEYBOARD.store(on, Ordering::SeqCst),
        "mouse" => VIEWER_MOUSE.store(on, Ordering::SeqCst),
        _ => {}
    }
    sync_enabled_from_viewers();
}

pub fn enabled() -> bool {
    ENABLED.load(Ordering::SeqCst)
}

fn is_standard_os_mouse(summary: &str) -> bool {
    summary.starts_with("mouse left ")
        || summary.starts_with("mouse right ")
        || summary.starts_with("mouse middle ")
        || summary.starts_with("mouse back ")
        || summary.starts_with("mouse forward ")
}

pub fn activator_label(activator: &Activator) -> String {
    activator_summary(activator)
}

fn activator_summary(activator: &Activator) -> String {
    match activator {
        Activator::Key { name } => format!("key {name}"),
        Activator::Mouse { button } => match button {
            MouseClickButton::Left => "mouse left".into(),
            MouseClickButton::Right => "mouse right".into(),
            MouseClickButton::Middle => "mouse middle".into(),
            MouseClickButton::Back => "mouse back".into(),
            MouseClickButton::Forward => "mouse forward".into(),
            MouseClickButton::Other { number } => format!("Button {}", number + 1),
        },
        Activator::Device { button } => (*button).id_str().to_string(),
    }
}

/// Mapping applied (summary already formatted, e.g. `link · fn1 → …`).
pub fn publish_link_line(summary: String) {
    let ts_ms = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_millis())
        .unwrap_or(0);
    publish(InputEventLine {
        ts_ms,
        source: "link",
        kind: "linkRemap".into(),
        summary: summary.clone(),
        detail: summary,
    });
}

/// Fired when a configured long-press threshold elapses (Link tab duration).
pub fn publish_long_press(activator: &Activator) {
    let input = activator_summary(activator);
    let summary = format!("long press · {input}");
    let ts_ms = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_millis())
        .unwrap_or(0);
    publish(InputEventLine {
        ts_ms,
        source: "link",
        kind: "longPress".into(),
        summary: summary.clone(),
        detail: summary,
    });
}

fn viewer_channel(line: &InputEventLine) -> &'static str {
    match line.kind.as_str() {
        "keyDown" | "keyUp" | "flagsChanged" | "longPress" | "linkRemap" => "keyboard",
        "mouseDown" | "mouseUp" if line.source == "os" && !is_standard_os_mouse(&line.summary) => {
            "keyboard"
        }
        "mouseDown" | "mouseUp" | "scrollWheel" => "mouse",
        _ if line.source == "hid" => "mouse",
        _ if line.summary.contains("key ") => "keyboard",
        _ => "mouse",
    }
}

fn viewer_wants_channel(channel: &str) -> bool {
    match channel {
        "keyboard" => VIEWER_KEYBOARD.load(Ordering::SeqCst),
        "mouse" => VIEWER_MOUSE.load(Ordering::SeqCst),
        _ => false,
    }
}

pub(crate) fn publish(line: InputEventLine) {
    if !enabled() {
        return;
    }
    let channel = viewer_channel(&line);
    if !viewer_wants_channel(channel) {
        return;
    }
    match EMIT_TX.try_send(line) {
        Ok(()) => {}
        Err(TrySendError::Full(_)) => {}
        Err(TrySendError::Disconnected(_)) => {}
    }
}

pub fn on_hid_report(report: &LastReport) {
    if !enabled() {
        return;
    }
    if report.ignored {
        if !throttle_ms(&LAST_VENDOR_EMIT_MS, report.ts_ms, VENDOR_MIN_INTERVAL_MS) {
            return;
        }
        let summary = format!("vendor report {}", report.hex);
        publish(InputEventLine {
            ts_ms: report.ts_ms,
            source: "hid",
            kind: "hidVendor".into(),
            summary: summary.clone(),
            detail: summary,
        });
        return;
    }

    let buttons = if report.buttons.is_empty() {
        "—".to_string()
    } else {
        report.buttons.join(", ")
    };
    let motion = if report.dx != 0 || report.dy != 0 {
        format!(" Δ({},{})", report.dx, report.dy)
    } else {
        String::new()
    };
    let wheel = if report.wheel != 0 || report.pan != 0 {
        format!(" wheel={} pan={}", report.wheel, report.pan)
    } else {
        String::new()
    };
    let motion_only = report.buttons.is_empty()
        && report.wheel == 0
        && report.pan == 0
        && (report.dx != 0 || report.dy != 0);
    if motion_only && !throttle_ms(&LAST_MOTION_EMIT_MS, report.ts_ms, MOTION_MIN_INTERVAL_MS) {
        return;
    }

    let summary = format!("[{buttons}]{motion}{wheel}");
    let detail = format!("{summary}\n{}", report.hex);
    publish(InputEventLine {
        ts_ms: report.ts_ms,
        source: "hid",
        kind: "hidReport".into(),
        summary,
        detail,
    });
}

