use crate::constants::BUNDLE_ID;

/// Accessibility TCC applies to the process — relaunch after grant.
/// `request_restart()` from an IPC thread often never exits menu-bar apps; exit on the
/// main thread and spawn a delayed `open -b` so the instance lock is released first.
#[tauri::command]
pub fn relaunch_app(app: tauri::AppHandle) {
    let bundle_id = BUNDLE_ID.to_string();
    let _ = std::process::Command::new("/bin/sh")
        .args([
            "-c",
            &format!("sleep 0.8; /usr/bin/open -bn '{bundle_id}'"),
        ])
        .spawn();

    let handle = app.clone();
    if app
        .run_on_main_thread(move || {
            handle.exit(0);
        })
        .is_err()
    {
        app.exit(0);
    }
}
