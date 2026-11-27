use crate::platform::apps;

/// `async` → off the main thread (spawns plutil/sips per app).
#[tauri::command]
pub async fn list_installed_apps() -> Result<Vec<apps::InstalledApp>, String> {
    apps::list_installed_apps()
}

#[tauri::command]
pub async fn get_app_icon(path: String) -> Option<String> {
    apps::app_icon_data_url(&path)
}
