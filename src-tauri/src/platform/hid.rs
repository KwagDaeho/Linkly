//! ELECOM HUGE HID discovery and open helpers.

use hidapi::HidApi;

use crate::domain::device::{is_huge, DeviceInfo, ELECOM_VID, HUGE_PIDS};

pub fn open_huge_device(
    api: &HidApi,
    info: &DeviceInfo,
) -> Result<hidapi::HidDevice, hidapi::HidError> {
    for d in api.device_list() {
        if d.vendor_id() == info.vendor_id
            && d.product_id() == info.product_id
            && d.path().to_string_lossy() == info.path
        {
            return d.open_device(api);
        }
    }
    api.open(info.vendor_id, info.product_id)
}

pub fn find_huge(api: &HidApi) -> Option<DeviceInfo> {
    api.device_list()
        .filter(|d| is_huge(d.vendor_id(), d.product_id()))
        .min_by_key(|d| {
            let usage_score = match (d.usage_page(), d.usage()) {
                (0x01, 0x02) => 0u8, // Generic Desktop / Mouse
                (0x01, _) => 1,
                _ => 2,
            };
            (usage_score, d.interface_number())
        })
        .map(|d| DeviceInfo {
            vendor_id: d.vendor_id(),
            product_id: d.product_id(),
            product_name: d.product_string().unwrap_or("HUGE TrackBall").to_string(),
            manufacturer: d.manufacturer_string().unwrap_or("ELECOM").to_string(),
            path: d.path().to_string_lossy().to_string(),
            is_huge: true,
        })
}

pub fn list_elecom_devices() -> Result<Vec<DeviceInfo>, String> {
    let api = HidApi::new().map_err(|e| e.to_string())?;
    let mut out = Vec::new();
    for d in api.device_list() {
        if d.vendor_id() != ELECOM_VID {
            continue;
        }
        out.push(device_info_from_hid(&d));
    }
    Ok(out)
}

fn is_input_hid(usage_page: u16, usage: u16) -> bool {
    matches!((usage_page, usage), (0x0001, 0x02) | (0x0001, 0x06))
}

fn device_info_from_hid(d: &hidapi::DeviceInfo) -> DeviceInfo {
    DeviceInfo {
        vendor_id: d.vendor_id(),
        product_id: d.product_id(),
        product_name: d
            .product_string()
            .map(|s| s.to_string())
            .unwrap_or_else(|| "Unknown device".to_string()),
        manufacturer: d
            .manufacturer_string()
            .map(|s| s.to_string())
            .unwrap_or_else(|| "Unknown".to_string()),
        path: d.path().to_string_lossy().to_string(),
        is_huge: is_huge(d.vendor_id(), d.product_id()),
    }
}

/// Prefer primary mouse/keyboard collection over duplicate consumer interfaces.
fn interface_priority(d: &hidapi::DeviceInfo) -> (u8, i32) {
    let usage_score = match (d.usage_page(), d.usage()) {
        (0x01, 0x02) => 0u8, // mouse / pointer
        (0x01, 0x06) => 0,   // keyboard
        (0x01, 0x04) | (0x01, 0x05) => 1,
        (0x01, 0x80) => 2,
        (0x01, _) => 3,
        (0x0C, 0x01) => 4, // consumer — often duplicates keyboard
        _ => 5,
    };
    (usage_score, d.interface_number())
}

fn device_identity_key(d: &hidapi::DeviceInfo) -> (u16, u16, String) {
    let name = d
        .product_string()
        .map(|s| s.to_string())
        .unwrap_or_default();
    (d.vendor_id(), d.product_id(), name)
}

/// Input devices from an existing `HidApi` (safe on the HID worker — never `HidApi::new` from UI).
pub fn collect_input_devices(api: &HidApi) -> Vec<DeviceInfo> {
    use std::collections::HashMap;

    let mut best: HashMap<(u16, u16, String), (DeviceInfo, (u8, i32))> = HashMap::new();
    for d in api.device_list() {
        if !is_input_hid(d.usage_page(), d.usage()) {
            continue;
        }
        let key = device_identity_key(&d);
        let priority = interface_priority(&d);
        let info = device_info_from_hid(&d);
        use std::collections::hash_map::Entry;
        match best.entry(key) {
            Entry::Vacant(slot) => {
                slot.insert((info, priority));
            }
            Entry::Occupied(mut slot) => {
                if priority < slot.get().1 {
                    slot.insert((info, priority));
                }
            }
        }
    }

    let mut out: Vec<DeviceInfo> = best.into_values().map(|(info, _)| info).collect();
    out.sort_by(|a, b| {
        a.product_name
            .cmp(&b.product_name)
            .then_with(|| a.manufacturer.cmp(&b.manufacturer))
            .then_with(|| a.vendor_id.cmp(&b.vendor_id))
            .then_with(|| a.product_id.cmp(&b.product_id))
    });
    out
}
