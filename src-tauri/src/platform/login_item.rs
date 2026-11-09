//! macOS System Settings “Login Items” (separate from Tauri LaunchAgent autostart).

#[cfg(target_os = "macos")]
const REMOVE_LOGIN_ITEMS_SCRIPT: &str = r#"
tell application "System Events"
  repeat with itemRef in login items
    try
      set itemName to name of itemRef
      if itemName is "Linkly" or itemName is "[DEV] Linkly" or itemName is "Elecom Huge Custom" then
        delete itemRef
      else
        try
          set itemPath to path of itemRef
          if itemPath contains "Linkly.app" or itemPath contains "linkly" then
            delete itemRef
          end if
        end try
      end if
    end try
  end repeat
end tell
"#;

#[cfg(target_os = "macos")]
pub fn remove_stale_login_items() {
    use std::process::Command;
    let out = Command::new("osascript")
        .arg("-e")
        .arg(REMOVE_LOGIN_ITEMS_SCRIPT)
        .output();
    match out {
        Ok(result) if result.status.success() => {
            log::info!("removed stale macOS login items for Linkly");
        }
        Ok(result) => {
            let stderr = String::from_utf8_lossy(&result.stderr);
            log::warn!("login item cleanup osascript failed: {stderr}");
        }
        Err(err) => log::warn!("login item cleanup spawn failed: {err}"),
    }
}

#[cfg(not(target_os = "macos"))]
pub fn remove_stale_login_items() {}
