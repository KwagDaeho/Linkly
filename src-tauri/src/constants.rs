//! App config identity (paths, bundle id). Not engine/input timing.

pub const APP_CONFIG_DIR: &str = "linkly";
pub const BUNDLE_ID: &str = "com.kwagdaeho.linkly";
pub const APP_LOG_DIR_NAME: &str = "Linkly";
/// Display name (debug builds: `[DEV] Linkly` via `build.rs`).
pub const PRODUCT_NAME: &str = env!("LINKLY_DISPLAY_NAME");
pub const PROFILE_FILENAME: &str = "profile.json";
pub const INPUT_DEVICES_FILENAME: &str = "input_devices.json";
pub const INSTANCE_LOCK_FILENAME: &str = "instance.lock";
/// Passed by `relaunch_app` so the new process waits for the old one's instance lock.
pub const RELAUNCH_ARG: &str = "--relaunch";
