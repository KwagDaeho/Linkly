//! Live input event stream for the Info-tab event viewer (Karabiner-style).

use std::sync::atomic::{AtomicBool, Ordering};

use serde::Serialize;

use crate::domain::engine::LastReport;
use crate::platform::app_bus;

static ENABLED: AtomicBool = AtomicBool::new(false);

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct InputEventLine {
    pub ts_ms: u128,
    pub source: &'static str,
    pub kind: String,
    pub summary: String,
    pub detail: String,
}

pub fn set_enabled(on: bool) {
    ENABLED.store(on, Ordering::SeqCst);
    if on {
        crate::platform::capture::ensure_watch_tap();
    }
}

pub fn enabled() -> bool {
    ENABLED.load(Ordering::SeqCst)
}

fn emit(line: InputEventLine) {
    if !enabled() {
        return;
    }
    app_bus::emit("input-event", line);
}

pub fn on_hid_report(report: &LastReport) {
    if !enabled() {
        return;
    }
    if report.ignored {
        let summary = format!("HID · vendor report {}", report.hex);
        emit(InputEventLine {
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
    let summary = format!("HID · [{buttons}]{motion}{wheel}");
    let detail = format!(
        "{summary}\n{}",
        report.hex
    );
    emit(InputEventLine {
        ts_ms: report.ts_ms,
        source: "hid",
        kind: "hidReport".into(),
        summary,
        detail,
    });
}

