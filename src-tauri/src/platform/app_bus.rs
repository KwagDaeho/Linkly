//! Shared Tauri app handle for HID / event-tap threads.

use serde::Serialize;
use std::sync::OnceLock;
use tauri::{AppHandle, Emitter};

static APP: OnceLock<AppHandle> = OnceLock::new();

/// True when Linkly itself is the frontmost (active) app. Safe from tap threads.
#[cfg(target_os = "macos")]
pub fn own_app_is_active() -> bool {
    use cocoa::base::{id, nil, BOOL, YES};
    use objc::{class, msg_send, sel, sel_impl};

    let _pool = crate::platform::autorelease::Pool::new();
    unsafe {
        let app: id = msg_send![class!(NSRunningApplication), currentApplication];
        if app == nil {
            return false;
        }
        let active: BOOL = msg_send![app, isActive];
        active == YES
    }
}

#[cfg(not(target_os = "macos"))]
pub fn own_app_is_active() -> bool {
    true
}

pub fn register(app: AppHandle) {
    let _ = APP.set(app);
}

pub fn emit<S: Serialize + Clone>(event: &str, payload: S) {
    if let Some(app) = APP.get() {
        let _ = app.emit(event, payload);
    }
}

/// Called from event-tap / worker threads: queue the update on the main thread instead of
/// `TrayIcon::set_tooltip`'s synchronous main-thread round trip (stalls taps, can deadlock quit).
pub fn set_tray_tooltip(text: &str) {
    if let Some(app) = APP.get() {
        let handle = app.clone();
        let text = text.to_string();
        let _ = app.run_on_main_thread(move || {
            if let Some(tray) = handle.tray_by_id("main") {
                let _ = tray.set_tooltip(Some(text));
            }
        });
    }
}

pub fn run_on_main<F>(f: F)
where
    F: FnOnce() + Send + 'static,
{
    if let Some(app) = APP.get() {
        let _ = app.run_on_main_thread(f);
    }
}

pub fn request_exit() {
    if let Some(app) = APP.get() {
        let handle = app.clone();
        let _ = app.run_on_main_thread(move || {
            handle.exit(0);
        });
    }
}
