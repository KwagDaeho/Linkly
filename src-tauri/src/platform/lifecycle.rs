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
const TAP_JOIN_TIMEOUT: Duration = Duration::from_millis(500);
/// Hard ceiling for the whole exit: a teardown step or the event loop wedging must not
/// leave a zombie window ("restarting…") holding the instance lock.
const EXIT_WATCHDOG: Duration = Duration::from_secs(3);

static SHUTDOWN: Once = Once::new();

/// Idempotent exit hook (Tauri `RunEvent::Exit` / `ExitRequested`).
pub fn on_app_exit(app: &AppHandle) {
    SHUTDOWN.call_once(|| shutdown_once(app));
}

fn shutdown_once(app: &AppHandle) {
    log::info!("app exit: tearing down HID, overlays, and event taps");
    arm_exit_watchdog();
    crate::platform::keyboards::clear_all();

    if let Some(state) = app.try_state::<AppState>() {
        state.engine.request_stop();
    }

    ball_scroll::shutdown();
    crate::domain::gesture::shutdown();
    capture::apply_capture_session(capture::CaptureSession::OFF);
    crate::platform::input_monitor::set_enabled(false);

    #[cfg(target_os = "macos")]
    {
        inject::tear_down_overlays_on_main();
    }

    suppress::clear_suppress();
    // A tap thread that is still starting has no run loop to stop yet, so its join can
    // block forever — bound the wait like the worker join below.
    let (taps_tx, taps_rx) = std::sync::mpsc::channel();
    thread::Builder::new()
        .name("tap-exit-join".into())
        .spawn(move || {
            suppress::stop_tap_thread();
            capture::stop_watch_tap();
            let _ = taps_tx.send(());
        })
        .ok();
    if taps_rx.recv_timeout(TAP_JOIN_TIMEOUT).is_err() {
        log::warn!("event tap threads did not exit within {TAP_JOIN_TIMEOUT:?} — continuing app exit");
    }

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

pub fn arm_exit_watchdog() {
    let _ = thread::Builder::new()
        .name("exit-watchdog".into())
        .spawn(|| {
            thread::sleep(EXIT_WATCHDOG);
            log::error!("app exit stalled for {EXIT_WATCHDOG:?} — forcing process exit");
            // `_exit`: skip atexit/static destructors, which can be what is wedged.
            unsafe { libc::_exit(0) };
        });
}

/// How often to re-check Accessibility while running.
const PERMISSION_POLL: Duration = Duration::from_millis(300);

/// Revoking Accessibility or Input Monitoring while an active event tap is installed
/// can freeze all keyboard/mouse input. Watch both and drop the taps the moment either
/// goes away; the HID worker recreates them once Accessibility is back.
pub fn start_permission_guard() {
    use crate::platform::permissions::{event_tap_allowed, input_monitoring_granted};
    let _ = thread::Builder::new()
        .name("permission-guard".into())
        .spawn(|| {
            let mut was = (event_tap_allowed(), input_monitoring_granted());
            log::info!("permissions: accessibility={} input_monitoring={}", was.0, was.1);
            loop {
                thread::sleep(PERMISSION_POLL);
                let now = (event_tap_allowed(), input_monitoring_granted());
                if now != was {
                    log::info!(
                        "permissions changed: accessibility={} input_monitoring={}",
                        now.0,
                        now.1
                    );
                }
                if (was.0 && !now.0) || (was.1 && !now.1) {
                    release_taps_after_revoke();
                }
                was = now;
            }
        });
}

fn release_taps_after_revoke() {
    log::warn!("permission revoked — releasing event taps");
    capture::disable_watch_tap_now();
    suppress::disable_tap_now();
    // Joining the tap threads can wait on their run loops; do it off this thread.
    let _ = thread::Builder::new()
        .name("tap-revoke-join".into())
        .spawn(|| {
            capture::stop_watch_tap();
            suppress::stop_tap_thread();
        });
}
