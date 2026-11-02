use crate::domain::chord_token;
use crate::domain::device::ButtonId;
use crate::domain::profile::{Activator, MouseClickButton};

pub fn button_id_capture_token(id: ButtonId) -> &'static str {
    chord_token::capture_token_for_button_id(id)
}

pub fn mouse_button_capture_token(button: &MouseClickButton) -> String {
    chord_token::capture_token_for_mouse_button(button)
}

pub fn activator_capture_token(activator: &Activator) -> Option<String> {
    match activator {
        Activator::Key { name } => Some(name.clone()),
        Activator::Mouse { button } => Some(chord_token::capture_token_for_mouse_button(button)),
        Activator::Device { button } => {
            Some(chord_token::capture_token_for_button_id(*button).to_string())
        }
    }
}
