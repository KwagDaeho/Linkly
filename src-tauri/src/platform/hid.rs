//! ELECOM HUGE HID discovery and open helpers.

use hidapi::HidApi;

use crate::domain::device::{
    device_identity_key, is_huge, is_wireless_huge, merge_device_info, merge_known_transports,
    preferred_product_name, DeviceIdentityKey, DeviceInfo, HidTransport, InputDeviceStatus,
    ParsedReport, ELECOM_VID,
};

#[cfg(target_os = "macos")]
use crate::platform::hid_macos;

fn hid_node_online(d: &hidapi::DeviceInfo) -> bool {
    #[cfg(target_os = "macos")]
    {
        return hid_macos::registry_entry_online(&d.path().to_string_lossy());
    }
    #[cfg(not(target_os = "macos"))]
    {
        let _ = d;
        true
    }
}

/// Pointer / HUGE collections: must open successfully (filters powered-off ghosts in hidapi).
fn hid_device_responds(api: &HidApi, d: &hidapi::DeviceInfo) -> bool {
    if is_huge(d.vendor_id(), d.product_id()) && is_wireless_huge(d.vendor_id(), d.product_id()) {
        return wireless_huge_dongle_attached(api, d);
    }
    let is_pointer = d.usage_page() == 0x01 && d.usage() == 0x02;
    if !is_pointer && !is_huge(d.vendor_id(), d.product_id()) {
        return true;
    }
    match d.open_device(api) {
        Ok(handle) => {
            drop(handle);
            true
        }
        Err(_) => false,
    }
}

fn wireless_huge_dongle_attached(api: &HidApi, d: &hidapi::DeviceInfo) -> bool {
    if !hid_node_online(d) {
        return false;
    }
    match d.open_device(api) {
        Ok(handle) => {
            drop(handle);
            true
        }
        Err(_) => false,
    }
}

/// Best-effort RF link (ball powered on). Idle may yield no reports; do not use for dongle presence.
pub fn probe_wireless_huge_ball_rf(api: &HidApi, d: &hidapi::DeviceInfo) -> bool {
    let Ok(handle) = d.open_device(api) else {
        return false;
    };
    let _ = handle.set_blocking_mode(true);
    // Wake/status poke seen on ELECOM wireless receivers (best-effort).
    let ping = [0x06u8, 0x01, 0x00, 0, 0, 0, 0, 0];
    let _ = handle.send_feature_report(&ping);
    let mut buf = [0u8; 64];
    let deadline = std::time::Instant::now() + std::time::Duration::from_millis(420);
    while std::time::Instant::now() < deadline {
        match handle.read_timeout(&mut buf, 90) {
            Ok(0) => continue,
            Ok(n) => {
                if ParsedReport::from_bytes(&buf[..n]).is_some() {
                    return true;
                }
                if n >= 1 && buf[0] == 0x01 {
                    return true;
                }
            }
            Err(_) => return false,
        }
    }
    false
}

fn hid_entry_attached(api: &HidApi, d: &hidapi::DeviceInfo) -> bool {
    if !hid_node_online(d) {
        return false;
    }
    hid_device_responds(api, d)
}

fn hid_transport_for_path(path: &str) -> HidTransport {
    #[cfg(target_os = "macos")]
    {
        return hid_macos::registry_transport(path);
    }
    #[cfg(not(target_os = "macos"))]
    {
        let _ = path;
        HidTransport::Unknown
    }
}

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
        .filter(|d| hid_entry_attached(api, d))
        .min_by_key(|d| {
            let usage_score = match (d.usage_page(), d.usage()) {
                (0x01, 0x02) => 0u8, // Generic Desktop / Mouse
                (0x01, _) => 1,
                _ => 2,
            };
            (usage_score, d.interface_number())
        })
        .map(|d| {
            let mut info = device_info_from_hid(d);
            info.is_huge = true;
            info
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
    let path = d.path().to_string_lossy().to_string();
    let transport = hid_transport_for_path(&path);
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
        path: path.clone(),
        is_huge: is_huge(d.vendor_id(), d.product_id()),
        transport,
        known_transports: if transport.indicates_physical_link() {
            vec![transport]
        } else {
            vec![]
        },
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

fn hid_device_identity_key(d: &hidapi::DeviceInfo) -> DeviceIdentityKey {
    (d.vendor_id(), d.product_id())
}

#[derive(Debug, Clone, Default)]
pub struct InputScanSnapshot {
    pub devices: Vec<DeviceInfo>,
    pub active_transport_by_key: std::collections::HashMap<DeviceIdentityKey, HidTransport>,
    pub seen_transports_by_key:
        std::collections::HashMap<DeviceIdentityKey, std::collections::HashSet<HidTransport>>,
}

/// Refresh the OS device list, then return attached input devices and per-key transports.
pub fn scan_input_snapshot(api: &mut HidApi) -> InputScanSnapshot {
    let _ = api.refresh_devices();
    collect_input_snapshot(api)
}

/// Refresh the OS device list, then return presently attached input devices.
pub fn scan_input_devices(api: &mut HidApi) -> Vec<DeviceInfo> {
    scan_input_snapshot(api).devices
}

pub fn collect_input_snapshot(api: &HidApi) -> InputScanSnapshot {
    use std::collections::{HashMap, HashSet};

    let mut seen_transports_by_key: HashMap<DeviceIdentityKey, HashSet<HidTransport>> =
        HashMap::new();
    for d in api.device_list() {
        if !is_input_hid(d.usage_page(), d.usage()) {
            continue;
        }
        if !hid_entry_attached(api, d) {
            continue;
        }
        let transport = hid_transport_for_path(&d.path().to_string_lossy());
        if transport.indicates_physical_link() {
            seen_transports_by_key
                .entry(hid_device_identity_key(d))
                .or_default()
                .insert(transport);
        }
    }

    let mut best: HashMap<DeviceIdentityKey, (DeviceInfo, (u8, i32))> = HashMap::new();
    for d in api.device_list() {
        if !is_input_hid(d.usage_page(), d.usage()) {
            continue;
        }
        if !hid_entry_attached(api, d) {
            continue;
        }
        let info = device_info_from_hid(&d);
        if !info.transport.indicates_physical_link() {
            continue;
        }
        let key = hid_device_identity_key(&d);
        let priority = interface_priority(&d);
        use std::collections::hash_map::Entry;
        match best.entry(key) {
            Entry::Vacant(slot) => {
                slot.insert((info, priority));
            }
            Entry::Occupied(mut slot) => {
                let (prev, prev_priority) = slot.get();
                let merged = merge_device_info(prev, &info);
                if priority < *prev_priority {
                    slot.insert((merged, priority));
                } else {
                    slot.insert((
                        DeviceInfo {
                            product_name: preferred_product_name(
                                &prev.product_name,
                                &merged.product_name,
                            ),
                            ..merged
                        },
                        *prev_priority,
                    ));
                }
            }
        }
    }

    let mut active_transport_by_key = HashMap::new();
    let mut devices: Vec<DeviceInfo> = Vec::new();
    for (key, (mut info, _)) in best {
        if let Some(set) = seen_transports_by_key.get(&key) {
            info.known_transports = merge_known_transports(
                &info.known_transports,
                &set.iter().copied().collect::<Vec<_>>(),
            );
            if let Some(active) = set
                .iter()
                .copied()
                .min_by_key(|t| t.display_order())
            {
                active_transport_by_key.insert(key, active);
                info.transport = active;
            }
        }
        devices.push(info);
    }
    devices.sort_by(|a, b| {
        a.product_name
            .cmp(&b.product_name)
            .then_with(|| a.manufacturer.cmp(&b.manufacturer))
            .then_with(|| a.vendor_id.cmp(&b.vendor_id))
            .then_with(|| a.product_id.cmp(&b.product_id))
    });

    InputScanSnapshot {
        devices,
        active_transport_by_key,
        seen_transports_by_key,
    }
}

/// Input devices from an existing `HidApi` (safe on the HID worker — never `HidApi::new` from UI).
pub fn collect_input_devices(api: &HidApi) -> Vec<DeviceInfo> {
    collect_input_snapshot(api).devices
}

#[cfg(all(test, target_os = "macos"))]
#[test]
fn macos_collects_attached_input_devices() {
    let mut api = HidApi::new().expect("hidapi");
    let _ = api.refresh_devices();
    let collected = collect_input_devices(&api);
    eprintln!("macos collected {} input device(s)", collected.len());
    for d in &collected {
        eprintln!(
            "  {:04x}:{:04x} {} online_path={}",
            d.vendor_id, d.product_id, d.product_name, d.path
        );
    }
    assert!(
        !collected.is_empty(),
        "hidapi listed input HIDs but collect_input_devices returned none"
    );
    let mut known = std::collections::HashMap::new();
    let snapshot = collect_input_snapshot(&api);
    let (statuses, _) = build_input_device_statuses(&mut known, &snapshot, None);
    for s in &statuses {
        assert!(
            s.connected,
            "{}:{:04x} should be connected",
            s.product_name,
            s.product_id
        );
    }
}

/// Merge scan into `known`, return sorted UI rows with per-device connection / profile flags.
pub fn build_input_device_statuses(
    known: &mut std::collections::HashMap<DeviceIdentityKey, DeviceInfo>,
    snapshot: &InputScanSnapshot,
    profile_target: Option<&DeviceInfo>,
) -> (Vec<InputDeviceStatus>, bool) {
    use std::collections::HashSet;

    let current = &snapshot.devices;
    let mut dirty = false;
    for d in current {
        let key = device_identity_key(d);
        if let Some(seen) = snapshot.seen_transports_by_key.get(&key) {
            let merged_transports =
                merge_known_transports(&d.known_transports, &seen.iter().copied().collect::<Vec<_>>());
            if merged_transports != d.known_transports {
                let mut copy = d.clone();
                copy.known_transports = merged_transports;
                match known.get(&key) {
                    None => {
                        known.insert(key, copy);
                        dirty = true;
                    }
                    Some(prev) => {
                        let merged = merge_device_info(prev, &copy);
                        if prev != &merged {
                            known.insert(key, merged);
                            dirty = true;
                        }
                    }
                }
                continue;
            }
        }
        match known.get(&key) {
            None => {
                known.insert(key, d.clone());
                dirty = true;
            }
            Some(prev) => {
                let merged = merge_device_info(prev, d);
                if prev.path != merged.path
                    || prev.manufacturer != merged.manufacturer
                    || prev.product_name != merged.product_name
                    || prev.is_huge != merged.is_huge
                    || prev.transport != merged.transport
                    || prev.known_transports != merged.known_transports
                {
                    known.insert(key, merged);
                    dirty = true;
                }
            }
        }
    }

    for (key, seen) in &snapshot.seen_transports_by_key {
        let slice: Vec<HidTransport> = seen.iter().copied().collect();
        match known.get_mut(key) {
            None => continue,
            Some(info) => {
                let merged = merge_known_transports(&info.known_transports, &slice);
                if merged != info.known_transports {
                    info.known_transports = merged;
                    dirty = true;
                }
            }
        }
    }

    let connected_keys: HashSet<_> = current.iter().map(device_identity_key).collect();
    let target_key = profile_target.map(device_identity_key);

    let mut out: Vec<InputDeviceStatus> = known
        .values()
        .map(|info| {
            let key = device_identity_key(info);
            let connected = connected_keys.contains(&key);
            let active_transport = if connected {
                snapshot.active_transport_by_key.get(&key).copied()
            } else {
                None
            };
            let known_transports = if info.known_transports.is_empty() {
                merge_known_transports(&[], std::slice::from_ref(&info.transport))
            } else {
                info.known_transports.clone()
            };
            let transport = active_transport.unwrap_or(info.transport);
            InputDeviceStatus {
                vendor_id: info.vendor_id,
                product_id: info.product_id,
                product_name: info.product_name.clone(),
                manufacturer: info.manufacturer.clone(),
                path: info.path.clone(),
                is_huge: info.is_huge,
                transport,
                connected,
                profile_target: target_key.as_ref() == Some(&key),
                active_transport,
                known_transports,
            }
        })
        .collect();

    out.sort_by(|a, b| {
        a.product_name
            .cmp(&b.product_name)
            .then_with(|| a.manufacturer.cmp(&b.manufacturer))
            .then_with(|| a.vendor_id.cmp(&b.vendor_id))
            .then_with(|| a.product_id.cmp(&b.product_id))
    });

    (out, dirty)
}

/// Override `connected` for wireless HUGE: dongle stays in the list, dot reflects RF link.
pub fn patch_wireless_huge_connected_status(
    api: &HidApi,
    statuses: &mut [InputDeviceStatus],
    huge_rf_last_input: &parking_lot::Mutex<Option<std::time::Instant>>,
    profile_enabled: bool,
) {
    use std::time::Instant;

    for d in api.device_list() {
        if !is_huge(d.vendor_id(), d.product_id()) || !is_wireless_huge(d.vendor_id(), d.product_id()) {
            continue;
        }
        if !wireless_huge_dongle_attached(api, d) {
            if !profile_enabled {
                *huge_rf_last_input.lock() = None;
            }
            continue;
        }

        let rf_now = probe_wireless_huge_ball_rf(api, d);
        {
            let mut last = huge_rf_last_input.lock();
            if rf_now {
                *last = Some(Instant::now());
            } else if !profile_enabled {
                *last = None;
            }
        }

        let linked = rf_now || huge_rf_last_input.lock().is_some();
        let key = (d.vendor_id(), d.product_id());
        for row in statuses.iter_mut() {
            if (row.vendor_id, row.product_id) != key {
                continue;
            }
            row.connected = linked;
            if linked {
                if row.active_transport.is_none() {
                    row.active_transport = Some(row.transport);
                }
            } else {
                row.active_transport = None;
            }
        }
    }
}

#[cfg(all(test, target_os = "macos"))]
#[test]
#[ignore = "manual: toggle HUGE ball power and compare 0 vs N reports"]
fn diag_huge_spontaneous_reports() {
    let mut api = HidApi::new().expect("hidapi");
    let _ = api.refresh_devices();
    for d in api.device_list() {
        if !is_huge(d.vendor_id(), d.product_id()) {
            continue;
        }
        let Ok(handle) = d.open_device(&api) else {
            continue;
        };
        let _ = handle.set_blocking_mode(true);
        eprintln!("listening 3s for spontaneous HUGE reports...");
        let mut buf = [0u8; 64];
        let start = std::time::Instant::now();
        let mut count = 0;
        while start.elapsed() < std::time::Duration::from_secs(3) {
            match handle.read_timeout(&mut buf, 100) {
                Ok(0) => {}
                Ok(n) => {
                    count += 1;
                    eprintln!("  spontaneous len={n} {:02x?}", &buf[..n.min(16)]);
                }
                Err(err) => eprintln!("  err={err}"),
            }
        }
        eprintln!("  total reports in 3s: {count}");
    }
}

#[cfg(all(test, target_os = "macos"))]
#[test]
#[ignore = "manual HID feature dump"]
fn diag_huge_feature_reports() {
    let mut api = HidApi::new().expect("hidapi");
    let _ = api.refresh_devices();
    for d in api.device_list() {
        if !is_huge(d.vendor_id(), d.product_id()) {
            continue;
        }
        eprintln!(
            "HUGE {:04x}:{:04x} path={}",
            d.vendor_id(),
            d.product_id(),
            d.path().to_string_lossy()
        );
        let Ok(handle) = d.open_device(&api) else {
            eprintln!("  open failed");
            continue;
        };
        let ping_sets: &[[u8; 8]] = &[
            [0x05, 0x00, 0x00, 0, 0, 0, 0, 0],
            [0x06, 0x01, 0x00, 0, 0, 0, 0, 0],
        ];
        for ping in ping_sets {
            if let Err(err) = handle.send_feature_report(ping) {
                eprintln!("  send_feature {:02x?} err={err}", &ping[..3]);
            } else {
                eprintln!("  send_feature {:02x?} ok", &ping[..3]);
            }
        }
        let mut stream = [0u8; 64];
        for i in 0..8 {
            match handle.read_timeout(&mut stream, 60) {
                Ok(0) => eprintln!("  read[{i}] timeout/empty"),
                Ok(n) => eprintln!("  read[{i}] len={n} {:02x?}", &stream[..n.min(16)]),
                Err(err) => eprintln!("  read[{i}] err={err}"),
            }
        }
        for report_id in 0u8..16 {
            let mut buf = [0u8; 32];
            buf[0] = report_id;
            match handle.get_feature_report(&mut buf) {
                Ok(n) if n > 0 => {
                    eprintln!(
                        "  feature id={report_id:02x} len={n} {:02x?}",
                        &buf[..n.min(32)]
                    );
                }
                Ok(_) => {}
                Err(err) => eprintln!("  feature id={report_id:02x} err={err}"),
            }
            match handle.get_input_report(&mut buf) {
                Ok(n) if n > 0 => {
                    eprintln!(
                        "  input id={report_id:02x} len={n} {:02x?}",
                        &buf[..n.min(32)]
                    );
                }
                Ok(_) => {}
                Err(err) => eprintln!("  input id={report_id:02x} err={err}"),
            }
        }
    }
}
