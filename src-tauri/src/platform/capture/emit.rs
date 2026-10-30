use crate::domain::device::ButtonId;
use crate::domain::profile::{Activator, ComboActivator};
use crate::platform::app_bus;
use super::session;
use super::types::{ActivatorCapture, CaptureChord, ComboTriggerCapture};

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

/// HUGE / OS left while `left_click_escape` — same as keyboard Esc for the active capture mode.
pub fn emit_capture_escape_from_pointer() {
    if session::combo_trigger_capture_active() {
        #[cfg(target_os = "macos")]
        {
            app_bus::emit(
                "combo-trigger-capture",
                ComboTriggerCapture {
                    escape: true,
                    rejected: None,
                    combo: None,
                },
            );
        }
        return;
    }
    if session::key_capture_active() {
        emit_chord(CaptureChord {
            keys: Vec::new(),
            escape: true,
        });
        return;
    }
    if session::activator_capture_active() {
        emit_activator(ActivatorCapture {
            escape: true,
            rejected: None,
            activator: None,
        });
    }
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

pub fn emit_combo_trigger_huge(button: ButtonId) {
    if !session::combo_trigger_capture_active() {
        return;
    }
    #[cfg(target_os = "macos")]
    {
        let (modifiers, keys) = super::macos::combo_held_parts();
        app_bus::emit(
            "combo-trigger-capture",
            ComboTriggerCapture {
                escape: false,
                rejected: None,
                combo: Some(ComboActivator {
                    modifiers,
                    keys,
                    button: Some(button),
                    trigger: Some(Activator::Huge { button }),
                }),
            },
        );
    }
}

pub fn emit_combo_trigger_activator(activator: Activator) {
    if !session::combo_trigger_capture_active() {
        return;
    }
    #[cfg(target_os = "macos")]
    {
        let (modifiers, keys) = super::macos::combo_held_parts();
        app_bus::emit(
            "combo-trigger-capture",
            ComboTriggerCapture {
                escape: false,
                rejected: None,
                combo: Some(ComboActivator {
                    modifiers,
                    keys,
                    button: None,
                    trigger: Some(activator),
                }),
            },
        );
    }
}
