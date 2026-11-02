use crate::domain::device::ButtonId;
use crate::domain::profile::MouseClickButton;

pub fn capture_token_for_button_id(id: ButtonId) -> &'static str {
    match id {
        ButtonId::Left => "MouseLeft",
        ButtonId::Right => "MouseRight",
        ButtonId::Middle => "MouseMiddle",
        ButtonId::Back => "MouseBack",
        ButtonId::Forward => "MouseForward",
        ButtonId::Fn1 => "Fn1",
        ButtonId::Fn2 => "Fn2",
        ButtonId::Fn3 => "Fn3",
        ButtonId::WheelTiltLeft => "WheelTiltLeft",
        ButtonId::WheelTiltRight => "WheelTiltRight",
    }
}

pub fn button_id_for_capture_token(token: &str) -> Option<ButtonId> {
    Some(match token {
        "MouseLeft" => ButtonId::Left,
        "MouseRight" => ButtonId::Right,
        "MouseMiddle" => ButtonId::Middle,
        "MouseBack" => ButtonId::Back,
        "MouseForward" => ButtonId::Forward,
        "Fn1" => ButtonId::Fn1,
        "Fn2" => ButtonId::Fn2,
        "Fn3" => ButtonId::Fn3,
        "WheelTiltLeft" => ButtonId::WheelTiltLeft,
        "WheelTiltRight" => ButtonId::WheelTiltRight,
        _ => return None,
    })
}

pub fn capture_token_for_mouse_button(button: &MouseClickButton) -> String {
    match button {
        MouseClickButton::Left => "MouseLeft".into(),
        MouseClickButton::Right => "MouseRight".into(),
        MouseClickButton::Middle => "MouseMiddle".into(),
        MouseClickButton::Back => "MouseBack".into(),
        MouseClickButton::Forward => "MouseForward".into(),
        MouseClickButton::Other { number } => format!("Button{}", number + 1),
    }
}

/// Tokens stored in `ComboActivator.keys` that are not plain keyboard key names.
pub fn is_hardware_capture_token(token: &str) -> bool {
    button_id_for_capture_token(token).is_some() || token.starts_with("Button")
}

pub fn mouse_button_for_catalog_button(id: ButtonId) -> Option<MouseClickButton> {
    match id {
        ButtonId::Left => Some(MouseClickButton::Left),
        ButtonId::Right => Some(MouseClickButton::Right),
        ButtonId::Middle => Some(MouseClickButton::Middle),
        ButtonId::Back => Some(MouseClickButton::Back),
        ButtonId::Forward => Some(MouseClickButton::Forward),
        _ => None,
    }
}
