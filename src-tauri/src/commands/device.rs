use crate::app::state::AppState;
use crate::domain::device;
use crate::domain::engine;
use tauri::State;

#[tauri::command]
pub fn list_devices(state: State<'_, AppState>) -> Vec<device::InputDeviceStatus> {
    state.engine.input_devices()
}

#[tauri::command]
pub fn get_connected(state: State<'_, AppState>) -> Option<device::DeviceInfo> {
    state.engine.connected_device()
}

#[tauri::command]
pub fn get_last_report(state: State<'_, AppState>) -> Option<engine::LastReport> {
    state.engine.last_report()
}

#[tauri::command]
pub fn button_catalog() -> Vec<serde_json::Value> {
    device::ButtonId::ALL
        .into_iter()
        .map(|id| {
            serde_json::json!({
                "id": id,
                "hiddenFromMacos": id.is_hidden_from_macos(),
            })
        })
        .collect()
}

#[tauri::command]
pub fn list_keyboards() -> Vec<crate::platform::keyboards::KeyboardInfo> {
    crate::platform::keyboards::connected_keyboards()
}

/// Arm/cancel a one-shot physical key capture on `device_key` (any keyboard if `None`).
#[tauri::command]
pub fn set_key_remap_capture(armed: bool, device_key: Option<String>) {
    crate::platform::keyboards::set_capture(armed, device_key);
}
