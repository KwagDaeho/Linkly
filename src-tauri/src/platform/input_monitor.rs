//! Live input event stream for the Info-tab event viewer (Karabiner-style).

use std::sync::atomic::{AtomicBool, AtomicU64, Ordering};
use std::sync::mpsc::{sync_channel, TrySendError};
use std::sync::LazyLock;
use std::thread;
use std::time::{Duration, Instant};

use serde::Serialize;

use crate::domain::engine::LastReport;
use crate::domain::profile::{Activator, MouseClickButton};
use crate::platform::app_bus;
use crate::platform::input_sources::{self, SourceKind};

static EMIT_TX: LazyLock<std::sync::mpsc::SyncSender<InputEventLine>> = LazyLock::new(|| {
    let (tx, rx) = sync_channel(512);
    thread::Builder::new()
        .name("input-event-emit".into())
        .spawn(move || {
            while let Ok(mut line) = rx.recv() {
                let now_ms = crate::clock::unix_ms();
                if !throttle_ms(
                    &LAST_UI_EMIT_MS,
                    now_ms,
                    UI_EMIT_MIN_INTERVAL_MS,
                ) {
                    continue;
                }
                resolve_device(&mut line);
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
static LAST_UI_EMIT_MS: AtomicU64 = AtomicU64::new(0);

const MOTION_MIN_INTERVAL_MS: u64 = 66;
const VENDOR_MIN_INTERVAL_MS: u64 = 250;
/// Cap IPC to WebView (paused JS must not grow an unbounded Tauri/Wry queue).
const UI_EMIT_MIN_INTERVAL_MS: u64 = 12;

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
    /// Physical device (or "Linkly" for its own injected input), when known.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub device: Option<String>,
    /// Resolved into `device` off the event tap thread.
    #[serde(skip)]
    pub device_hint: Option<(SourceKind, Instant)>,
}

/// The HID callback may land just after the CGEvent: give it a moment.
fn resolve_device(line: &mut InputEventLine) {
    let Some((kind, at)) = line.device_hint.take() else {
        return;
    };
    if line.device.is_some() {
        return;
    }
    // Pointer motion is frequent: no waiting (keys and buttons are worth a short wait).
    let attempts = if kind == SourceKind::Pointer { 1 } else { 4 };
    for attempt in 0..attempts {
        if let Some(label) = input_sources::near(kind, at) {
            line.device = Some(label);
            return;
        }
        if attempt + 1 < attempts {
            thread::sleep(Duration::from_millis(10));
        }
    }
}

static CATALOG_LABEL: LazyLock<parking_lot::Mutex<Option<String>>> =
    LazyLock::new(|| parking_lot::Mutex::new(None));

/// The trackball the HID worker reads (labels its raw report lines).
pub fn set_catalog_device(label: Option<String>) {
    *CATALOG_LABEL.lock() = label;
}

fn sync_enabled_from_viewers() {
    let on = VIEWER_KEYBOARD.load(Ordering::SeqCst) || VIEWER_MOUSE.load(Ordering::SeqCst);
    ENABLED.store(on, Ordering::SeqCst);
    if on {
        crate::platform::capture::ensure_watch_tap();
        input_sources::ensure_started();
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

/// Start the input-event emit thread at app launch (not from the CGEventTap callback).
pub fn warmup_emit_pipeline() {
    let _ = &*EMIT_TX;
}

pub fn enabled() -> bool {
    ENABLED.load(Ordering::SeqCst)
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
    let ts_ms = crate::clock::unix_ms();
    publish(InputEventLine {
        ts_ms,
        source: "link",
        kind: "linkRemap".into(),
        summary: summary.clone(),
        detail: summary,
        device: None,
        device_hint: None,
    });
}

pub(crate) fn publish(line: InputEventLine) {
    if !enabled() {
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
            device: CATALOG_LABEL.lock().clone(),
            device_hint: None,
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
    publish(InputEventLine {
        ts_ms: report.ts_ms,
        source: "hid",
        kind: "hidReport".into(),
        summary: summary.clone(),
        detail: summary,
        device: CATALOG_LABEL.lock().clone(),
        device_hint: None,
    });
}
