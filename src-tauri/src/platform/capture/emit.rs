use crate::domain::device::ButtonId;
use crate::domain::profile::Activator;
use crate::platform::app_bus;
use super::session;
use super::types::{ActivatorCapture, CaptureChord};

pub(crate) fn emit_chord(payload: CaptureChord) {
    app_bus::emit("key-capture", payload);
}

pub fn refresh_combo_key_capture() {
    #[cfg(target_os = "macos")]
    super::macos::refresh_combo_preview();
}

pub(crate) fn emit_activator(payload: ActivatorCapture) {
    app_bus::emit("activator-capture", payload);
}

/// Left pointer during combo capture — FE hit-tests Cancel vs chord token.
pub fn emit_capture_left_pointer() {
    app_bus::emit("capture-left-pointer", ());
}

pub(crate) fn emit_activator_choice(activator: Activator) {
    emit_activator(ActivatorCapture {
        escape: false,
        rejected: None,
        activator: Some(activator),
    });
}

pub fn emit_activator_from_hid(activator: Activator) {
    if session::combo_trigger_capture_active() {
        if let Activator::Huge { button } = activator {
            emit_combo_trigger_huge(button);
        }
        return;
    }
    if !session::activator_capture() {
        return;
    }
    emit_activator_choice(activator);
}

pub fn merge_combo_capture_token(token: String) {
    if !session::combo_trigger_capture_active() {
        return;
    }
    #[cfg(target_os = "macos")]
    {
        super::macos::note_capture_token(&token, true);
        super::macos::emit_combo_preview();
    }
}

pub fn release_combo_capture_token_for_huge(button: ButtonId) {
    if !session::combo_trigger_capture_active() {
        return;
    }
    #[cfg(target_os = "macos")]
    {
        let token = super::token::button_id_capture_token(button);
        super::macos::note_capture_token(token, false);
        super::macos::emit_combo_preview();
    }
}

pub fn emit_combo_trigger_huge(button: ButtonId) {
    if !session::combo_trigger_capture_active() {
        return;
    }
    #[cfg(target_os = "macos")]
    {
        let token = super::token::button_id_capture_token(button);
        super::macos::note_capture_token(token, true);
        super::macos::emit_combo_preview();
    }
}

pub fn emit_combo_trigger_activator(activator: Activator) {
    if !session::combo_trigger_capture_active() {
        return;
    }
    #[cfg(target_os = "macos")]
    {
        if let Some(token) = super::token::activator_capture_token(&activator) {
            super::macos::note_capture_token(&token, true);
            super::macos::emit_combo_preview();
        }
    }
}
