#[tauri::command]
pub fn relaunch_app(app: tauri::AppHandle) {
    app.request_restart();
}
