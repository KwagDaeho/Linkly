//! Keyboard / mouse capture for custom chords and ball-scroll activators.

mod emit;
mod session;
mod token;
mod types;
mod macos;

use crate::platform::app_bus;

pub use emit::{
    emit_activator_from_hid, emit_capture_left_pointer, emit_combo_trigger_activator,
    emit_combo_trigger_catalog_button, merge_combo_capture_token, refresh_combo_key_capture,
    release_combo_capture_token_for_catalog_button,
};
pub use session::{
    activator_capture_active, allow_left_activator, apply_capture_session,
    combo_trigger_capture_active, input_capture_active, key_capture_active,
    set_activator_capture, set_combo_activator_capture, set_combo_trigger_capture,
    set_key_capture, set_ui_modal, ui_modal_active,
};
pub use types::{ActivatorCapture, CaptureChord, CaptureSession, ComboTriggerCapture};

pub fn register_app_handle(app: tauri::AppHandle) {
    app_bus::register(app);
}

#[cfg(target_os = "macos")]
pub use macos::activator_name_for_keycode;

pub fn ensure_watch_tap() {
    macos::ensure_tap_thread();
}

/// Stop the watch tap from receiving events immediately (thread exits via `stop_watch_tap`).
pub fn disable_watch_tap_now() {
    #[cfg(target_os = "macos")]
    macos::disable_key_capture_tap_now();
}

pub fn stop_watch_tap() {
    macos::stop_tap_thread();
}
