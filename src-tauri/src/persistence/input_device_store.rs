use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;

use crate::constants::{APP_CONFIG_DIR, INPUT_DEVICES_FILENAME};
use crate::domain::device::{device_identity_key, merge_device_info, DeviceIdentityKey, DeviceInfo};

fn config_path() -> Result<PathBuf, String> {
    let base = dirs::config_dir().ok_or_else(|| "Could not resolve config directory".to_string())?;
    let dir = base.join(APP_CONFIG_DIR);
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    Ok(dir.join(INPUT_DEVICES_FILENAME))
}

pub fn load_known() -> HashMap<DeviceIdentityKey, DeviceInfo> {
    let Ok(path) = config_path() else {
        return HashMap::new();
    };
    let Ok(raw) = fs::read_to_string(path) else {
        return HashMap::new();
    };
    let list: Vec<DeviceInfo> = serde_json::from_str(&raw).unwrap_or_default();
    let mut out = HashMap::new();
    for d in list {
        let key = device_identity_key(&d);
        let mut d = d;
        if d.known_transports.is_empty() && d.transport.indicates_physical_link() {
            d.known_transports = vec![d.transport];
        }
        match out.entry(key) {
            std::collections::hash_map::Entry::Vacant(slot) => {
                slot.insert(d);
            }
            std::collections::hash_map::Entry::Occupied(mut slot) => {
                let merged = merge_device_info(slot.get(), &d);
                slot.insert(merged);
            }
        }
    }
    out
}

pub fn save_known(known: &HashMap<DeviceIdentityKey, DeviceInfo>) -> Result<(), String> {
    let path = config_path()?;
    let mut list: Vec<&DeviceInfo> = known.values().collect();
    list.sort_by(|a, b| {
        a.product_name
            .cmp(&b.product_name)
            .then_with(|| a.manufacturer.cmp(&b.manufacturer))
            .then_with(|| a.vendor_id.cmp(&b.vendor_id))
            .then_with(|| a.product_id.cmp(&b.product_id))
    });
    let raw = serde_json::to_string_pretty(&list).map_err(|e| e.to_string())?;
    fs::write(path, raw).map_err(|e| e.to_string())
}
