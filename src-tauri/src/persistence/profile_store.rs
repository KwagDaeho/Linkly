use std::fs;
use std::path::PathBuf;

use crate::constants::{APP_CONFIG_DIR, LEGACY_APP_CONFIG_DIR, PROFILE_FILENAME};
use crate::domain::profile::Profile;

fn config_root() -> Result<PathBuf, String> {
    dirs::config_dir().ok_or_else(|| "Could not resolve config directory".to_string())
}

pub fn profile_path() -> Result<PathBuf, String> {
    let base = config_root()?;
    let dir = base.join(APP_CONFIG_DIR);
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    let path = dir.join(PROFILE_FILENAME);
    if !path.exists() {
        let legacy = base
            .join(LEGACY_APP_CONFIG_DIR)
            .join(PROFILE_FILENAME);
        if legacy.is_file() {
            let _ = fs::copy(&legacy, &path);
        }
    }
    Ok(path)
}

pub fn load_profile() -> Profile {
    let Ok(path) = profile_path() else {
        return Profile::default();
    };
    match fs::read_to_string(&path) {
        Ok(raw) => serde_json::from_str(&raw).unwrap_or_default(),
        Err(_) => Profile::default(),
    }
}

pub fn save_profile(profile: &Profile) -> Result<(), String> {
    let path = profile_path()?;
    let raw = serde_json::to_string_pretty(profile).map_err(|e| e.to_string())?;
    fs::write(path, raw).map_err(|e| e.to_string())
}
