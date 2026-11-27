//! Non-macOS inject stubs (permissions live in `platform::permissions`).

use crate::domain::device::ButtonId;
use crate::domain::profile::Action;

pub fn click_at_cursor() {}
pub fn pin_cursor() {}
pub fn restore_pinned_cursor() {}
pub fn release_ball_scroll_pin_for_quit() {}
pub fn keep_pinned_cursor() {}
pub fn restore_cursor_active() -> bool {
    false
}
pub fn maintain_restored_cursor() {}
pub fn expire_restored_cursor_if_due() {}
pub fn finish_restored_cursor() {}
pub fn tick_restore_cursor(_hid_dx: f64, _hid_dy: f64) {}
pub fn end_idle_ball_scroll() {}
pub fn move_by(_dx: f64, _dy: f64) {}
pub fn scroll_notches_ex(
    _dx_notches: f64,
    _dy_notches: f64,
    _pointer: &crate::domain::profile::PointerSettings,
    _continuous: bool,
) {
}
pub fn scroll_ball(
    _hid_dx: i16,
    _hid_dy: i16,
    _ball: &crate::domain::profile::BallScrollSettings,
) {
}
pub fn scroll_by_units_ex(
    _dx_units: i32,
    _dy_units: i32,
    _pointer: &crate::domain::profile::PointerSettings,
    _continuous: bool,
) {
}
pub fn set_shared_pointer_mode(_shared: bool) {}
pub fn shared_pointer_mode() -> bool {
    false
}
pub fn synthetic_buttons_held() -> bool {
    false
}
pub fn neutralize_os_mouse_button(_button: &crate::domain::profile::MouseClickButton) {}
pub struct CatalogPhysicalDrag;
impl CatalogPhysicalDrag {
    pub fn set(&mut self, _button: &crate::domain::profile::MouseClickButton, _down: bool) {}
}
impl Default for CatalogPhysicalDrag {
    fn default() -> Self {
        Self
    }
}
pub fn set_catalog_physical_drag(_drag: CatalogPhysicalDrag) {}
pub fn clear_catalog_physical_drag() {}
pub fn press_action(
    _id: ButtonId,
    _action: &Action,
    _pointer: &crate::domain::profile::PointerSettings,
) {
}
pub fn press_action_forced(
    id: ButtonId,
    action: &Action,
    pointer: &crate::domain::profile::PointerSettings,
) {
    press_action(id, action, pointer);
}
pub fn release_action(_id: ButtonId, _action: &Action) {}
pub fn release_action_forced(id: ButtonId, action: &Action) {
    release_action(id, action);
}
pub fn default_mouse_button(
    _id: ButtonId,
) -> Option<crate::domain::profile::MouseClickButton> {
    None
}
pub fn release_chord_hold(_modifiers: &[String], _keys: &[String]) {}
pub fn with_chord_action<F: FnOnce()>(_mods: &[String], f: F) {
    f();
}
pub fn chord_action_inject() -> bool {
    false
}
pub fn should_block_chord_modifier(_name: &str) -> bool {
    false
}

pub fn tear_down_overlays_on_main() {}
pub fn live_modifier_flags() -> u64 {
    0
}
pub fn key_code_for_name(_name: &str) -> Option<u16> {
    None
}

pub fn show_gesture_trail() {}
pub fn hide_gesture_trail() {}
pub fn track_gesture_trail() {}
pub fn cursor_location() -> (f64, f64) {
    (0.0, 0.0)
}
