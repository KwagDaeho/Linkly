//! Coordinated teardown so macOS logout/shutdown does not hang on tray apps.

use std::sync::Once;
use std::thread;
use std::time::Duration;

use tauri::{AppHandle, Manager};

use crate::app::state::AppState;
use crate::domain::ball_scroll;
use crate::platform::capture;
use crate::platform::suppress;
#[cfg(target_os = "macos")]
use crate::platform::inject;

const WORKER_JOIN_TIMEOUT: Duration = Duration::from_millis(800);

static SHUTDOWN: Once = Once::new();

/// Idempotent exit hook (Tauri `RunEvent::Exit` / `ExitRequested`).
pub fn on_app_exit(app: &AppHandle) {
    SHUTDOWN.call_once(|| shutdown_once(app));
}

fn shutdown_once(app: &AppHandle) {
    log::info!("app exit: tearing down HID, overlays, and event taps");

    if let Some(state) = app.try_state::<AppState>() {
        state.engine.request_stop();
    }

    ball_scroll::shutdown();
    capture::apply_capture_session(capture::CaptureSession::OFF);
    crate::platform::input_monitor::set_enabled(false);

    #[cfg(target_os = "macos")]
    {
        inject::tear_down_overlays_on_main();
    }

    suppress::clear_suppress();
    suppress::stop_tap_thread();
    capture::stop_watch_tap();

    if let Some(state) = app.try_state::<AppState>() {
        let engine = state.engine.clone();
        let (done_tx, done_rx) = std::sync::mpsc::channel();
        thread::Builder::new()
            .name("catalog-exit-join".into())
            .spawn(move || {
                engine.join_worker();
                let _ = done_tx.send(());
            })
            .ok();
        if done_rx.recv_timeout(WORKER_JOIN_TIMEOUT).is_err() {
            log::warn!(
                "HID worker did not exit within {:?} — continuing app exit",
                WORKER_JOIN_TIMEOUT
            );
        }
    }
}
