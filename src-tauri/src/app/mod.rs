pub mod setup;
pub mod state;

use crate::app::state::AppState;
use crate::commands;
use crate::constants::{APP_LOG_DIR_NAME, BUNDLE_ID, PRODUCT_NAME};
use crate::domain::engine::Engine;
use crate::platform::lifecycle;
use crate::persistence::{instance_lock, profile_store};
use std::io::Write;
use std::sync::Arc;
use tauri::{Manager, WindowEvent};

fn install_panic_hook() {
    std::panic::set_hook(Box::new(|info| {
        let line = format!("{info}\n");
        log::error!("panic: {info}");
        if let Some(path) = dirs::home_dir()
            .map(|home| home.join(format!("Library/Logs/{APP_LOG_DIR_NAME}/rust-panic.log")))
        {
            if let Some(parent) = path.parent() {
                let _ = std::fs::create_dir_all(parent);
            }
            if let Ok(mut file) = std::fs::OpenOptions::new()
                .create(true)
                .append(true)
                .open(path)
            {
                let _ = file.write_all(line.as_bytes());
            }
        }
    }));
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    install_panic_hook();
    let _ = env_logger::try_init();

    let relaunch = std::env::args().any(|arg| arg == crate::constants::RELAUNCH_ARG);
    let instance_lock = match instance_lock::acquire_instance_lock(relaunch) {
        instance_lock::InstanceLock::Acquired(file) => Some(file),
        instance_lock::InstanceLock::Unavailable(err) => {
            log::error!("instance lock unavailable ({err}) — continuing without it");
            None
        }
        instance_lock::InstanceLock::Busy => {
            log::warn!("another {PRODUCT_NAME} instance is already running — exiting");
            // Best-effort: focus the existing app if present.
            let _ = std::process::Command::new("open")
                .args(["-b", BUNDLE_ID])
                .status();
            return;
        }
    };

    let profile = profile_store::load_profile();
    let engine = Arc::new(Engine::new(profile));
    // Start HID remapper only after we own the instance lock (not before),
    // so a duplicate launch cannot attach a second engine.

    tauri::Builder::default()
        .enable_macos_default_menu(false)
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.show();
                let _ = window.set_focus();
            }
        }))
        .manage(AppState {
            engine: Arc::clone(&engine),
            _instance_lock: instance_lock,
        })
        .invoke_handler(tauri::generate_handler![
            commands::list_devices,
            commands::get_connected,
            commands::get_profile,
            commands::save_profile,
            commands::get_last_report,
            commands::accessibility_status,
            commands::permission_status,
            commands::request_accessibility,
            commands::open_accessibility_settings,
            commands::request_input_monitoring,
            commands::open_input_monitoring_settings,
            commands::open_privacy_security_settings,
            commands::reset_tcc_permissions,
            commands::relaunch_app,
            commands::set_accent_color,
            commands::set_gesture_recording,
            commands::button_catalog,
            commands::set_key_capture,
            commands::apply_capture_session,
            commands::set_activator_capture,
            commands::set_combo_activator_capture,
            commands::set_combo_trigger_capture,
            commands::set_ui_modal,
            commands::merge_combo_capture_token,
            commands::list_installed_apps,
            commands::get_app_icon,
            commands::set_input_event_monitor_enabled,
            commands::set_event_viewer_channel,
            commands::list_keyboards,
            commands::set_key_remap_capture,
            commands::autostart_is_enabled,
            commands::set_autostart_enabled,
        ])
        .setup(|app| setup::setup_app(app))
        .on_window_event(|window, event| match event {
            WindowEvent::CloseRequested { api, .. } if window.label() == "main" => {
                api.prevent_close();
                let _ = window.hide();
            }
            // Closing a viewer destroys its WebView without a React unmount, so the
            // channel-off cleanup never runs — turn the input stream off here.
            WindowEvent::Destroyed => {
                if let Some(channel) = window.label().strip_prefix("event-viewer-") {
                    crate::platform::input_monitor::set_viewer_channel(channel, false);
                }
            }
            _ => {}
        })
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(|app_handle, event| match event {
            tauri::RunEvent::ExitRequested { .. } | tauri::RunEvent::Exit => {
                lifecycle::on_app_exit(app_handle);
            }
            // Dock click / Finder or Spotlight open of the running (hidden) app.
            #[cfg(target_os = "macos")]
            tauri::RunEvent::Reopen { .. } => {
                if let Some(window) = app_handle.get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            }
            _ => {}
        });
}
