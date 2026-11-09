use tauri::{AppHandle, Manager};
use tauri_plugin_autostart::ManagerExt;

#[tauri::command]
pub fn autostart_is_enabled(app: AppHandle) -> Result<bool, String> {
    app.autolaunch().is_enabled().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn set_autostart_enabled(app: AppHandle, enabled: bool) -> Result<bool, String> {
    let manager = app.autolaunch();
    if enabled {
        manager.enable().map_err(|e| e.to_string())?;
    } else {
        manager.disable().map_err(|e| e.to_string())?;
        crate::platform::login_item::remove_stale_login_items();
    }
    manager.is_enabled().map_err(|e| e.to_string())
}
