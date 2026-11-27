//! Keyboard registry (IOHIDManager), per-device key remaps applied with `hidutil`,
//! and per-device key capture for the remap editor.
//!
//! Capture reads raw HID values from the chosen keyboard only, so the captured key is
//! the physical key on that device (before any `UserKeyMapping`) — no guessing which
//! keyboard produced a CGEvent.

use serde::Serialize;

use crate::domain::profile::{ButtonMappingEntry, Profile};

pub const KEY_CAPTURE_EVENT: &str = "key-remap-capture";

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct KeyboardInfo {
    pub device_key: String,
    pub vendor_id: u16,
    pub product_id: u16,
    pub product_name: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct KeyCapture {
    device_key: String,
    usage: u16,
    /// Trigger name the event tap uses for this key (`Activator::Key`).
    name: String,
}

#[cfg(target_os = "macos")]
pub use imp::*;

#[cfg(not(target_os = "macos"))]
mod stub {
    use super::*;
    pub fn start() {}
    pub fn set_profile(_profile: &Profile) {}
    pub fn proxy_rows() -> Vec<ButtonMappingEntry> {
        Vec::new()
    }
    pub fn proxy_alias(_name: &str) -> Option<crate::domain::profile::Activator> {
        None
    }
    pub fn connected_keyboards() -> Vec<KeyboardInfo> {
        Vec::new()
    }
    pub fn set_capture(_armed: bool, _device_key: Option<String>) {}
    pub fn clear_all() {}
    pub fn held_modifier_bits() -> u8 {
        0
    }
    pub fn modifier_flags_for_keycode_side(_bit_index: usize) -> u64 {
        0
    }
    pub fn merge_needed() -> bool {
        false
    }
}
#[cfg(not(target_os = "macos"))]
pub use stub::*;

#[cfg(target_os = "macos")]
mod imp {
    use std::collections::HashMap;
    use std::ffi::c_void;
    use std::process::{Command, Stdio};
    use std::sync::atomic::{AtomicBool, AtomicU8, Ordering};
    use std::sync::mpsc::{self, RecvTimeoutError, Sender};
    use std::sync::{LazyLock, Once, OnceLock};
    use std::thread;
    use std::time::Duration;

    use core_foundation::base::{CFType, TCFType};
    use core_foundation::dictionary::CFDictionary;
    use core_foundation::number::CFNumber;
    use core_foundation::runloop::{kCFRunLoopDefaultMode, CFRunLoop};
    use core_foundation::string::CFString;
    use parking_lot::Mutex;

    use super::{KeyCapture, KeyboardInfo, KEY_CAPTURE_EVENT};
    use crate::domain::hid_keys;
    use crate::domain::profile::key_remap::{self, DeviceKeyPlan, KeyResolver};
    use crate::domain::profile::{ButtonMappingEntry, Profile};
    use crate::platform::app_bus;

    type IOHIDManagerRef = *mut c_void;
    type IOHIDDeviceRef = *mut c_void;
    type IOHIDValueRef = *mut c_void;
    type IOHIDElementRef = *mut c_void;
    type IOReturn = i32;
    type DeviceCallback = extern "C" fn(*mut c_void, IOReturn, *mut c_void, IOHIDDeviceRef);
    type ValueCallback = extern "C" fn(*mut c_void, IOReturn, *mut c_void, IOHIDValueRef);

    #[link(name = "IOKit", kind = "framework")]
    extern "C" {
        fn IOHIDManagerCreate(allocator: *const c_void, options: u32) -> IOHIDManagerRef;
        fn IOHIDManagerSetDeviceMatching(manager: IOHIDManagerRef, matching: *const c_void);
        fn IOHIDManagerRegisterDeviceMatchingCallback(
            manager: IOHIDManagerRef,
            callback: DeviceCallback,
            context: *mut c_void,
        );
        fn IOHIDManagerRegisterDeviceRemovalCallback(
            manager: IOHIDManagerRef,
            callback: DeviceCallback,
            context: *mut c_void,
        );
        fn IOHIDManagerRegisterInputValueCallback(
            manager: IOHIDManagerRef,
            callback: ValueCallback,
            context: *mut c_void,
        );
        fn IOHIDManagerScheduleWithRunLoop(
            manager: IOHIDManagerRef,
            run_loop: *const c_void,
            mode: *const c_void,
        );
        fn IOHIDManagerOpen(manager: IOHIDManagerRef, options: u32) -> IOReturn;
        fn IOHIDDeviceGetProperty(device: IOHIDDeviceRef, key: *const c_void) -> *const c_void;
        fn IOHIDValueGetElement(value: IOHIDValueRef) -> IOHIDElementRef;
        fn IOHIDValueGetIntegerValue(value: IOHIDValueRef) -> isize;
        fn IOHIDElementGetUsagePage(element: IOHIDElementRef) -> u32;
        fn IOHIDElementGetUsage(element: IOHIDElementRef) -> u32;
        fn IOHIDElementGetDevice(element: IOHIDElementRef) -> IOHIDDeviceRef;
    }

    const KEYBOARD_PAGE: u32 = 0x07;
    /// Debounce bursts (multi-interface attach, rapid profile edits) into one pass.
    const RESYNC_DEBOUNCE: Duration = Duration::from_millis(250);
    /// The HID event service can appear after the IOHIDDevice match — apply again.
    const ATTACH_SECOND_PASS: Duration = Duration::from_millis(1500);

    static START: Once = Once::new();
    static RESYNC: OnceLock<Mutex<Sender<()>>> = OnceLock::new();
    static PLAN: LazyLock<Mutex<DeviceKeyPlan>> =
        LazyLock::new(|| Mutex::new(DeviceKeyPlan::default()));
    /// IOHIDDeviceRef (as usize) → keyboard; one keyboard may expose several interfaces.
    static KEYBOARDS: LazyLock<Mutex<HashMap<usize, KeyboardInfo>>> =
        LazyLock::new(|| Mutex::new(HashMap::new()));
    /// device key → pairs last written with `hidutil` (absent = untouched by Linkly).
    static APPLIED: LazyLock<Mutex<HashMap<String, Vec<(u64, u64)>>>> =
        LazyLock::new(|| Mutex::new(HashMap::new()));
    static CAPTURE_ARMED: AtomicBool = AtomicBool::new(false);
    /// IOHIDDeviceRef → held modifier bits (bit n = usage 0xE0 + n), after remaps.
    static HELD_MODS: LazyLock<Mutex<HashMap<usize, u8>>> =
        LazyLock::new(|| Mutex::new(HashMap::new()));
    static HELD_BITS: AtomicU8 = AtomicU8::new(0);
    static CAPTURE_DEVICE: LazyLock<Mutex<Option<String>>> = LazyLock::new(|| Mutex::new(None));

    pub fn start() {
        START.call_once(|| {
            let (tx, rx) = mpsc::channel::<()>();
            let _ = RESYNC.set(Mutex::new(tx));
            let _ = thread::Builder::new()
                .name("link-key-remap".into())
                .spawn(move || loop {
                    if rx.recv().is_err() {
                        return;
                    }
                    loop {
                        match rx.recv_timeout(RESYNC_DEBOUNCE) {
                            Ok(()) => continue,
                            Err(RecvTimeoutError::Timeout) => break,
                            Err(RecvTimeoutError::Disconnected) => return,
                        }
                    }
                    apply();
                });
            let _ = thread::Builder::new()
                .name("link-keyboards".into())
                .spawn(run_hid_manager);
        });
    }

    fn resync() {
        if let Some(tx) = RESYNC.get() {
            let _ = tx.lock().send(());
        }
    }

    fn usage_for_name(name: &str) -> Option<u16> {
        crate::platform::inject::key_code_for_name(name).and_then(hid_keys::usage_for_keycode)
    }

    /// Recompute per-keyboard remaps from the profile's device triggers.
    pub fn set_profile(profile: &Profile) {
        let next = if profile.enabled {
            key_remap::plan(
                profile,
                &KeyResolver {
                    activator: &usage_for_name,
                    stroke: &usage_for_name,
                },
            )
        } else {
            DeviceKeyPlan::default()
        };
        let mut current = PLAN.lock();
        let changed = current.pairs != next.pairs;
        *current = next;
        drop(current);
        if changed {
            resync();
        }
    }

    /// Hidden trigger rows on proxy keys (merged into the live trigger list).
    pub fn proxy_rows() -> Vec<ButtonMappingEntry> {
        PLAN.lock().proxy_rows.clone()
    }

    /// Input a proxy key stands for (e.g. `F20` → mouse button 25), if any.
    pub fn proxy_alias(name: &str) -> Option<crate::domain::profile::Activator> {
        PLAN.lock().aliases.get(name).cloned()
    }

    pub fn connected_keyboards() -> Vec<KeyboardInfo> {
        let mut list: Vec<KeyboardInfo> = Vec::new();
        for info in KEYBOARDS.lock().values() {
            if !list.iter().any(|k| k.device_key == info.device_key) {
                list.push(info.clone());
            }
        }
        list.sort_by(|a, b| a.product_name.cmp(&b.product_name));
        list
    }

    /// Arm (or cancel) a one-shot capture of the next key pressed on `device_key`
    /// (`None` = any keyboard). The result is emitted as `KEY_CAPTURE_EVENT`.
    pub fn set_capture(armed: bool, device_key: Option<String>) {
        *CAPTURE_DEVICE.lock() = device_key;
        CAPTURE_ARMED.store(armed, Ordering::SeqCst);
    }

    /// Remaps live only while Linkly runs — drop them on quit.
    pub fn clear_all() {
        let applied: Vec<String> = APPLIED
            .lock()
            .drain()
            .filter(|(_, pairs)| !pairs.is_empty())
            .map(|(key, _)| key)
            .collect();
        for key in applied {
            run_hidutil(&key, &[]);
        }
    }

    fn apply() {
        let plan_pairs = PLAN.lock().pairs.clone();
        let keys: Vec<String> = connected_keyboards()
            .into_iter()
            .map(|k| k.device_key)
            .collect();
        for key in &keys {
            let want = plan_pairs.get(key).cloned().unwrap_or_default();
            let have = APPLIED.lock().get(key).cloned().unwrap_or_default();
            if want == have {
                continue;
            }
            if run_hidutil(key, &want) {
                APPLIED.lock().insert(key.clone(), want);
            }
        }
        APPLIED.lock().retain(|key, _| keys.contains(key));
    }

    fn run_hidutil(device_key: &str, pairs: &[(u64, u64)]) -> bool {
        let Some((vid, pid)) = device_key
            .split_once('-')
            .and_then(|(v, p)| Some((v.parse::<u16>().ok()?, p.parse::<u16>().ok()?)))
        else {
            return false;
        };
        let matching = format!(r#"{{"VendorID":{vid},"ProductID":{pid}}}"#);
        let entries: Vec<String> = pairs
            .iter()
            .map(|(src, dst)| {
                format!(
                    r#"{{"HIDKeyboardModifierMappingSrc":{src},"HIDKeyboardModifierMappingDst":{dst}}}"#
                )
            })
            .collect();
        let set = format!(r#"{{"UserKeyMapping":[{}]}}"#, entries.join(","));
        match Command::new("/usr/bin/hidutil")
            .args(["property", "--matching", &matching, "--set", &set])
            .stdout(Stdio::null())
            .stderr(Stdio::null())
            .status()
        {
            Ok(status) if status.success() => {
                log::info!("key remap: {device_key} ← {} pair(s)", pairs.len());
                true
            }
            Ok(status) => {
                log::warn!("hidutil failed for {device_key}: {status}");
                false
            }
            Err(err) => {
                log::warn!("hidutil spawn failed: {err}");
                false
            }
        }
    }

    fn run_hid_manager() {
        unsafe {
            let manager = IOHIDManagerCreate(std::ptr::null(), 0);
            if manager.is_null() {
                log::error!("keyboards: IOHIDManagerCreate failed");
                return;
            }
            let matching = CFDictionary::from_CFType_pairs(&[
                (
                    CFString::new("DeviceUsagePage").as_CFType(),
                    CFNumber::from(1i32).as_CFType(),
                ),
                (
                    CFString::new("DeviceUsage").as_CFType(),
                    CFNumber::from(6i32).as_CFType(),
                ),
            ]);
            IOHIDManagerSetDeviceMatching(manager, matching.as_concrete_TypeRef() as *const c_void);
            IOHIDManagerRegisterDeviceMatchingCallback(manager, on_match, std::ptr::null_mut());
            IOHIDManagerRegisterDeviceRemovalCallback(manager, on_remove, std::ptr::null_mut());
            IOHIDManagerRegisterInputValueCallback(manager, on_value, std::ptr::null_mut());
            let run_loop = CFRunLoop::get_current();
            IOHIDManagerScheduleWithRunLoop(
                manager,
                run_loop.as_concrete_TypeRef() as *const c_void,
                kCFRunLoopDefaultMode as *const c_void,
            );
            let rc = IOHIDManagerOpen(manager, 0);
            if rc != 0 {
                // Without Input Monitoring the registry still fills; capture stays silent.
                log::warn!("keyboards: IOHIDManagerOpen returned {rc:#x}");
            }
            CFRunLoop::run_current();
        }
    }

    fn int_property(device: IOHIDDeviceRef, key: &str) -> Option<i64> {
        let key = CFString::new(key);
        let value = unsafe { IOHIDDeviceGetProperty(device, key.as_concrete_TypeRef() as _) };
        if value.is_null() {
            return None;
        }
        let value = unsafe { CFType::wrap_under_get_rule(value as _) };
        value.downcast::<CFNumber>()?.to_i64()
    }

    fn string_property(device: IOHIDDeviceRef, key: &str) -> Option<String> {
        let key = CFString::new(key);
        let value = unsafe { IOHIDDeviceGetProperty(device, key.as_concrete_TypeRef() as _) };
        if value.is_null() {
            return None;
        }
        let value = unsafe { CFType::wrap_under_get_rule(value as _) };
        value.downcast::<CFString>().map(|s| s.to_string())
    }

    fn keyboard_info(device: IOHIDDeviceRef) -> Option<KeyboardInfo> {
        let vendor_id = u16::try_from(int_property(device, "VendorID")?).ok()?;
        let product_id = u16::try_from(int_property(device, "ProductID")?).ok()?;
        let product_name = string_property(device, "Product")
            .map(|name| name.trim().to_string())
            .filter(|name| !name.is_empty())
            .unwrap_or_else(|| "Keyboard".into());
        let lower = product_name.to_ascii_lowercase();
        if lower.contains("karabiner") || lower.contains("virtualhid") {
            return None;
        }
        Some(KeyboardInfo {
            device_key: format!("{vendor_id}-{product_id}"),
            vendor_id,
            product_id,
            product_name,
        })
    }

    extern "C" fn on_match(_: *mut c_void, _: IOReturn, _: *mut c_void, device: IOHIDDeviceRef) {
        let Some(info) = keyboard_info(device) else {
            return;
        };
        let key = info.device_key.clone();
        KEYBOARDS.lock().insert(device as usize, info);
        if merge_needed() {
            crate::platform::capture::ensure_watch_tap();
        }
        // A reconnected keyboard comes back without its mapping.
        APPLIED.lock().remove(&key);
        resync();
        let _ = thread::Builder::new()
            .name("key-remap-attach".into())
            .spawn(move || {
                thread::sleep(ATTACH_SECOND_PASS);
                APPLIED.lock().remove(&key);
                resync();
            });
    }

    extern "C" fn on_remove(_: *mut c_void, _: IOReturn, _: *mut c_void, device: IOHIDDeviceRef) {
        if HELD_MODS.lock().remove(&(device as usize)).is_some() {
            publish_held_flags();
        }
        if KEYBOARDS.lock().remove(&(device as usize)).is_some() {
            resync();
        }
    }

    /// macOS keeps modifier state per keyboard (Shift on one keyboard does not shift a
    /// key typed on another). The event tap ORs these into key/mouse events.
    /// Bit n = HID usage 0xE0 + n is physically held on some keyboard (after remaps).
    pub fn held_modifier_bits() -> u8 {
        HELD_BITS.load(Ordering::Relaxed)
    }

    /// Merging only matters with more than one keyboard.
    pub fn merge_needed() -> bool {
        connected_keyboards().len() > 1
    }

    /// (generic CGEventFlags bit, device-dependent bit) for usage 0xE0 + n.
    const MODIFIER_FLAGS: [(u64, u64); 8] = [
        (0x0004_0000, 0x0000_0001), // left control
        (0x0002_0000, 0x0000_0002), // left shift
        (0x0008_0000, 0x0000_0020), // left option
        (0x0010_0000, 0x0000_0008), // left command
        (0x0004_0000, 0x0000_2000), // right control
        (0x0002_0000, 0x0000_0004), // right shift
        (0x0008_0000, 0x0000_0040), // right option
        (0x0010_0000, 0x0000_0010), // right command
    ];

    pub fn modifier_flags_for_keycode_side(bit_index: usize) -> u64 {
        MODIFIER_FLAGS
            .get(bit_index)
            .map(|(generic, device)| generic | device)
            .unwrap_or(0)
    }

    fn publish_held_flags() {
        let held = HELD_MODS.lock().values().fold(0u8, |acc, bits| acc | bits);
        HELD_BITS.store(held, Ordering::Relaxed);
    }

    /// Usage the key produces after Linkly's `hidutil` remap on that keyboard.
    fn effective_usage(device_key: &str, usage: u32) -> u32 {
        let src = 0x7_0000_0000u64 | u64::from(usage);
        APPLIED
            .lock()
            .get(device_key)
            .and_then(|pairs| pairs.iter().find(|(s, _)| *s == src))
            .map(|(_, dst)| (*dst & 0xFFFF) as u32)
            .unwrap_or(usage)
    }

    fn note_modifier(device: IOHIDDeviceRef, device_key: &str, usage: u32, down: bool) {
        let effective = effective_usage(device_key, usage);
        if !(0xE0..=0xE7).contains(&effective) {
            return;
        }
        let bit = 1u8 << (effective - 0xE0);
        let mut held = HELD_MODS.lock();
        let entry = held.entry(device as usize).or_insert(0);
        if down {
            *entry |= bit;
        } else {
            *entry &= !bit;
        }
        drop(held);
        publish_held_flags();
    }

    extern "C" fn on_value(_: *mut c_void, _: IOReturn, _: *mut c_void, value: IOHIDValueRef) {
        let (usage, device, down) = unsafe {
            let element = IOHIDValueGetElement(value);
            if element.is_null() || IOHIDElementGetUsagePage(element) != KEYBOARD_PAGE {
                return;
            }
            (
                IOHIDElementGetUsage(element),
                IOHIDElementGetDevice(element),
                IOHIDValueGetIntegerValue(value) != 0,
            )
        };
        // 0x01–0x03 are rollover/error codes; usages past 0xE7 are not real keys.
        if !(0x04..=0xE7).contains(&usage) {
            return;
        }
        let Some(device_key) = KEYBOARDS
            .lock()
            .get(&(device as usize))
            .map(|k| k.device_key.clone())
        else {
            return;
        };
        note_modifier(device, &device_key, usage, down);
        if !down || !CAPTURE_ARMED.load(Ordering::SeqCst) {
            return;
        }
        if let Some(want) = CAPTURE_DEVICE.lock().as_ref() {
            if *want != device_key {
                return;
            }
        }
        let Some(code) = hid_keys::keycode_for_usage(usage as u16) else {
            return;
        };
        if CAPTURE_ARMED.swap(false, Ordering::SeqCst) {
            app_bus::emit(
                KEY_CAPTURE_EVENT,
                KeyCapture {
                    device_key,
                    usage: usage as u16,
                    name: crate::platform::capture::activator_name_for_keycode(code),
                },
            );
        }
    }
}
