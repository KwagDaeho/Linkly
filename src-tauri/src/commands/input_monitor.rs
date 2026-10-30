use crate::platform::input_monitor;

#[tauri::command]
pub fn set_input_event_monitor_enabled(enabled: bool) {
    input_monitor::set_enabled(enabled);
}
