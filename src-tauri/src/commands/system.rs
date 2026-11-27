use std::path::PathBuf;

use crate::constants::{BUNDLE_ID, RELAUNCH_ARG};

/// `…/Linkly.app` when running from a bundle (`Contents/MacOS/<exe>`).
fn current_app_bundle() -> Option<PathBuf> {
    let exe = std::env::current_exe().ok()?;
    let bundle = exe.parent()?.parent()?.parent()?;
    (bundle.extension()? == "app").then(|| bundle.to_path_buf())
}

fn shell_quote(raw: &str) -> String {
    format!("'{}'", raw.replace('\'', "'\\''"))
}

/// Accessibility TCC applies to the process — relaunch after grant.
/// `request_restart()` from an IPC thread often never exits menu-bar apps; exit on the
/// main thread and spawn a delayed `open -b`. `--relaunch` makes the new process wait
/// for this one to release the instance lock (teardown can outlast the 0.8s delay).
#[tauri::command]
pub fn relaunch_app(app: tauri::AppHandle) {
    use std::os::unix::process::CommandExt;

    // Relaunch this exact bundle (`-b` could pick another registered copy whose
    // ad-hoc signature has no TCC grant).
    let target = current_app_bundle()
        .map(|path| format!("-n {}", shell_quote(&path.to_string_lossy())))
        .unwrap_or_else(|| format!("-bn {}", shell_quote(BUNDLE_ID)));
    // Own process group: when Linkly was started by its LaunchAgent, launchd kills the
    // job's process group on exit — the helper must survive to start the new instance.
    let _ = std::process::Command::new("/bin/sh")
        .args([
            "-c",
            &format!("sleep 0.8; /usr/bin/open {target} --args {RELAUNCH_ARG}"),
        ])
        .process_group(0)
        .spawn();

    // If the event loop never gets to the exit (wedged main thread), still die so the
    // relaunched instance can take the lock instead of the window hanging on "restarting".
    crate::platform::lifecycle::arm_exit_watchdog();
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

/// UI accent color (0xRRGGBB) for the native trail / cursor-ring overlays.
#[tauri::command]
pub fn set_accent_color(rgb: u32) {
    crate::platform::accent::set(rgb);
}
