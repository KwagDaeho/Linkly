//! macOS TCC / Accessibility permission helpers.

#[derive(Debug, Clone, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PermissionStatus {
    pub accessibility: bool,
    pub input_monitoring: bool,
    pub post_event: bool,
    pub ready: bool,
}

#[cfg(target_os = "macos")]
mod macos {
    use super::PermissionStatus;

    #[link(name = "CoreGraphics", kind = "framework")]
    extern "C" {
        fn CGPreflightListenEventAccess() -> bool;
        fn CGRequestListenEventAccess() -> bool;
        fn CGPreflightPostEventAccess() -> bool;
        #[allow(dead_code)]
        fn CGRequestPostEventAccess() -> bool;
    }

    pub fn permission_status() -> PermissionStatus {
        let accessibility = macos_accessibility_client::accessibility::application_is_trusted();
        let input_monitoring = input_monitoring_granted();
        let post_event = unsafe { CGPreflightPostEventAccess() };
        // Input Monitoring is needed too: without it macOS strips key events from the
        // event tap and the trackball HID cannot be read.
        let ready = (accessibility || post_event) && input_monitoring;
        PermissionStatus {
            accessibility,
            input_monitoring,
            post_event,
            ready,
        }
    }

    pub fn accessibility_granted() -> bool {
        let status = permission_status();
        status.accessibility || status.post_event
    }

    /// An active event tap needs Accessibility itself (PostEvent can outlive it).
    pub fn event_tap_allowed() -> bool {
        macos_accessibility_client::accessibility::application_is_trusted()
    }

    /// Live check: `CGPreflightListenEventAccess` can keep answering "granted" after
    /// the user revokes it while the app runs; `IOHIDCheckAccess` reads TCC each time.
    /// Re-arming a tap the system disabled: never once either permission is gone
    /// (a tap without them can stall all input).
    pub fn tap_reenable_allowed() -> bool {
        event_tap_allowed() && input_monitoring_granted()
    }

    pub fn input_monitoring_granted() -> bool {
        unsafe { IOHIDCheckAccess(IOHID_REQUEST_TYPE_LISTEN_EVENT) == IOHID_ACCESS_TYPE_GRANTED }
    }

    static AX_PROMPTED: std::sync::atomic::AtomicBool = std::sync::atomic::AtomicBool::new(false);

    /// First call: macOS Accessibility prompt (it offers to open System Settings).
    /// After that (prompt dismissed or not shown again): open the Accessibility pane.
    pub fn prompt_accessibility() -> bool {
        use std::sync::atomic::Ordering;
        if AX_PROMPTED.swap(true, Ordering::SeqCst) {
            let _ = open_permission_settings();
            return macos_accessibility_client::accessibility::application_is_trusted();
        }
        macos_accessibility_client::accessibility::application_is_trusted_with_prompt()
    }

    #[link(name = "IOKit", kind = "framework")]
    extern "C" {
        fn IOHIDCheckAccess(request_type: u32) -> u32;
    }
    const IOHID_REQUEST_TYPE_LISTEN_EVENT: u32 = 1;
    const IOHID_ACCESS_TYPE_GRANTED: u32 = 0;
    const IOHID_ACCESS_TYPE_UNKNOWN: u32 = 2;

    /// macOS only prompts for Input Monitoring while undecided; otherwise open the pane.
    pub fn prompt_input_monitoring() -> bool {
        let undecided = unsafe { IOHIDCheckAccess(IOHID_REQUEST_TYPE_LISTEN_EVENT) }
            == IOHID_ACCESS_TYPE_UNKNOWN;
        if undecided {
            return unsafe { CGRequestListenEventAccess() };
        }
        let _ = open_input_monitoring_settings();
        unsafe { CGPreflightListenEventAccess() }
    }

    fn open_privacy_pane(pane: &str) -> Result<(), String> {
        tauri_plugin_opener::open_url(
            format!("x-apple.systempreferences:com.apple.preference.security?{pane}"),
            None::<&str>,
        )
        .map_err(|e| e.to_string())
    }

    pub fn open_permission_settings() -> Result<(), String> {
        open_privacy_pane("Privacy_Accessibility")
    }

    pub fn open_input_monitoring_settings() -> Result<(), String> {
        open_privacy_pane("Privacy_ListenEvent")
    }

    /// Privacy & Security root (where Gatekeeper “Open Anyway” appears after a block).
    pub fn open_privacy_security_settings() -> Result<(), String> {
        let urls = [
            "x-apple.systempreferences:com.apple.settings.PrivacySecurity.extension",
            "x-apple.systempreferences:com.apple.preference.security",
        ];
        for url in urls {
            if tauri_plugin_opener::open_url(url, None::<&str>).is_ok() {
                return Ok(());
            }
        }
        // Last resort: Security pref pane path
        std::process::Command::new("open")
            .arg("/System/Library/PreferencePanes/Security.prefPane")
            .status()
            .map_err(|e| e.to_string())?;
        Ok(())
    }

    /// Clear stale TCC rows for this bundle (common after ad-hoc update reinstall).
    /// Settings can still show the toggle ON while AXIsProcessTrusted is false.
    pub fn reset_tcc_permissions() -> Result<(), String> {
        for service in ["Accessibility", "ListenEvent", "PostEvent"] {
            let status = std::process::Command::new("/usr/bin/tccutil")
                .args(["reset", service, crate::constants::BUNDLE_ID])
                .status()
                .map_err(|e| e.to_string())?;
            if !status.success() {
                log::warn!("tccutil reset {service} exited with {status}");
            }
        }
        Ok(())
    }
}

#[cfg(not(target_os = "macos"))]
mod stub {
    use super::PermissionStatus;

    pub fn permission_status() -> PermissionStatus {
        PermissionStatus {
            accessibility: true,
            input_monitoring: true,
            post_event: true,
            ready: true,
        }
    }

    pub fn accessibility_granted() -> bool {
        true
    }

    pub fn event_tap_allowed() -> bool {
        true
    }

    pub fn input_monitoring_granted() -> bool {
        true
    }

    pub fn tap_reenable_allowed() -> bool {
        true
    }

    pub fn prompt_accessibility() -> bool {
        true
    }

    pub fn prompt_input_monitoring() -> bool {
        true
    }

    pub fn open_permission_settings() -> Result<(), String> {
        Ok(())
    }

    pub fn open_input_monitoring_settings() -> Result<(), String> {
        Ok(())
    }

    pub fn open_privacy_security_settings() -> Result<(), String> {
        Ok(())
    }

    pub fn reset_tcc_permissions() -> Result<(), String> {
        Ok(())
    }
}

#[cfg(target_os = "macos")]
pub use macos::*;
#[cfg(not(target_os = "macos"))]
pub use stub::*;
