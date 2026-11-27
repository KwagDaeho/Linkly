//! "Launch at login" via a per-user LaunchAgent.
//!
//! Replaces `tauri-plugin-autostart`, whose plist has no `KeepAlive`: if the app died
//! (crash, early-login failure) nothing brought it back until the next login.
//! `KeepAlive.SuccessfulExit = false` restarts on crash/abnormal exit only — Quit (exit 0)
//! stays quit.

use std::path::PathBuf;

use crate::constants::{BUNDLE_ID, PRODUCT_NAME};

fn label() -> String {
    if cfg!(debug_assertions) {
        format!("{BUNDLE_ID}.dev")
    } else {
        BUNDLE_ID.to_string()
    }
}

fn agents_dir() -> Option<PathBuf> {
    dirs::home_dir().map(|home| home.join("Library/LaunchAgents"))
}

fn plist_path() -> Option<PathBuf> {
    agents_dir().map(|dir| dir.join(format!("{}.plist", label())))
}

/// File written by `tauri-plugin-autostart` (≤ 1.5.4): `~/Library/LaunchAgents/<app name>.plist`.
fn legacy_plist_path() -> Option<PathBuf> {
    agents_dir().map(|dir| dir.join(format!("{PRODUCT_NAME}.plist")))
}

fn xml_escape(raw: &str) -> String {
    raw.replace('&', "&amp;")
        .replace('<', "&lt;")
        .replace('>', "&gt;")
        .replace('"', "&quot;")
}

fn plist_body(exe: &str) -> String {
    format!(
        r#"<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>{label}</string>
  <key>ProgramArguments</key>
  <array>
    <string>{exe}</string>
  </array>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <dict>
    <key>SuccessfulExit</key>
    <false/>
  </dict>
  <key>AbandonProcessGroup</key>
  <true/>
  <key>ThrottleInterval</key>
  <integer>10</integer>
  <key>ProcessType</key>
  <string>Interactive</string>
  <key>LimitLoadToSessionType</key>
  <string>Aqua</string>
</dict>
</plist>
"#,
        label = xml_escape(&label()),
        exe = xml_escape(exe),
    )
}

fn write_plist() -> Result<(), String> {
    let path = plist_path().ok_or("home directory unavailable")?;
    let exe = std::env::current_exe().map_err(|e| e.to_string())?;
    let body = plist_body(&exe.to_string_lossy());
    if std::fs::read_to_string(&path).ok().as_deref() == Some(body.as_str()) {
        return Ok(());
    }
    if let Some(dir) = path.parent() {
        std::fs::create_dir_all(dir).map_err(|e| e.to_string())?;
    }
    std::fs::write(&path, body).map_err(|e| e.to_string())
}

fn remove_file_if_present(path: Option<PathBuf>) -> Result<(), String> {
    let Some(path) = path else {
        return Ok(());
    };
    match std::fs::remove_file(&path) {
        Ok(()) => Ok(()),
        Err(err) if err.kind() == std::io::ErrorKind::NotFound => Ok(()),
        Err(err) => Err(err.to_string()),
    }
}

pub fn is_enabled() -> bool {
    plist_path().is_some_and(|p| p.exists()) || legacy_plist_path().is_some_and(|p| p.exists())
}

pub fn enable() -> Result<(), String> {
    write_plist()?;
    remove_file_if_present(legacy_plist_path())
}

/// Removes the plist only. The job stays loaded until logout — `launchctl bootout`
/// would kill this very process when it was started at login.
pub fn disable() -> Result<(), String> {
    remove_file_if_present(plist_path())?;
    remove_file_if_present(legacy_plist_path())?;
    #[cfg(target_os = "macos")]
    crate::platform::login_item::remove_stale_login_items();
    Ok(())
}

/// Only an installed copy may silently repoint the login job — running a build from
/// `target/` or a mounted DMG must not hijack it.
fn running_from_applications() -> bool {
    let Ok(exe) = std::env::current_exe() else {
        return false;
    };
    let user_apps = dirs::home_dir().map(|home| home.join("Applications"));
    exe.starts_with("/Applications") || user_apps.is_some_and(|dir| exe.starts_with(dir))
}

/// Startup: migrate the legacy plist and keep the executable path current (app moved/updated).
pub fn refresh_if_enabled() {
    if cfg!(debug_assertions) || !running_from_applications() || !is_enabled() {
        return;
    }
    if let Err(err) = enable() {
        log::warn!("launch agent refresh failed: {err}");
    }
}

#[cfg(all(test, target_os = "macos"))]
mod tests {
    use super::plist_body;
    use std::io::Write;
    use std::process::{Command, Stdio};

    #[test]
    fn plist_is_valid_and_escapes_path() {
        let body = plist_body("/Applications/A & B <x>.app/Contents/MacOS/linkly");
        assert!(body.contains("A &amp; B &lt;x&gt;.app"));
        assert!(body.contains("<key>SuccessfulExit</key>"));
        let mut child = Command::new("/usr/bin/plutil")
            .args(["-lint", "-"])
            .stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .spawn()
            .expect("plutil");
        child.stdin.take().unwrap().write_all(body.as_bytes()).unwrap();
        assert!(child.wait().unwrap().success(), "plutil rejected plist");
    }
}
