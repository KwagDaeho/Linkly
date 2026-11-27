use std::fs;
use std::path::PathBuf;

use crate::constants::{APP_CONFIG_DIR, PROFILE_FILENAME};
use crate::domain::profile::Profile;

fn config_root() -> Result<PathBuf, String> {
    dirs::config_dir().ok_or_else(|| "Could not resolve config directory".to_string())
}

pub fn profile_path() -> Result<PathBuf, String> {
    let base = config_root()?;
    let dir = base.join(APP_CONFIG_DIR);
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    Ok(dir.join(PROFILE_FILENAME))
}

pub fn load_profile() -> Profile {
    let Ok(path) = profile_path() else {
        return Profile::default();
    };
    match fs::read_to_string(&path) {
        Ok(raw) => match serde_json::from_str(&raw) {
            Ok(profile) => profile,
            Err(err) => {
                // Keep the unreadable file instead of overwriting it on the next save.
                let backup = path.with_extension("json.corrupt");
                log::error!("profile.json unreadable ({err}); moved to {}", backup.display());
                let _ = fs::rename(&path, &backup);
                Profile::default()
            }
        },
        Err(_) => Profile::default(),
    }
}

/// Write to a temp file and rename, so a kill mid-save (logout, power loss) cannot leave a
/// truncated profile.json.
pub fn save_profile(profile: &Profile) -> Result<(), String> {
    let path = profile_path()?;
    let raw = serde_json::to_string_pretty(profile).map_err(|e| e.to_string())?;
    let tmp = path.with_extension("json.tmp");
    fs::write(&tmp, raw).map_err(|e| e.to_string())?;
    fs::rename(&tmp, &path).map_err(|e| e.to_string())
}
