use crate::platform::launch_agent;

#[tauri::command]
pub fn autostart_is_enabled() -> Result<bool, String> {
    Ok(launch_agent::is_enabled())
}

/// `async` → runs off the main thread (disable shells out to osascript / System Events).
#[tauri::command]
pub async fn set_autostart_enabled(enabled: bool) -> Result<bool, String> {
    if enabled {
        launch_agent::enable()?;
    } else {
        launch_agent::disable()?;
    }
    Ok(launch_agent::is_enabled())
}
