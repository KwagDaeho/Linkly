//! Which physical device an OS input came from, for the input event viewer.
//!
//! CGEvents do not say which keyboard or mouse sent them; IOHID value callbacks do.
//! Each device notes its latest key / button / pointer activity here, and the viewer
//! pairs an event with the device that reported the same kind of input at that moment.

use std::collections::HashMap;
use std::sync::LazyLock;
use std::time::{Duration, Instant};

use parking_lot::Mutex;

use crate::domain::profile::Profile;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum SourceKind {
    Key,
    Button,
    Pointer,
}

/// HID callback and CGEvent can arrive in either order; pair within this window.
const PAIR_WINDOW: Duration = Duration::from_millis(120);

struct Recent {
    label: String,
    at: Instant,
}

static RECENT: LazyLock<Mutex<HashMap<u8, Recent>>> = LazyLock::new(|| Mutex::new(HashMap::new()));
/// device key (`vid-pid`) → user's display name.
static NAMES: LazyLock<Mutex<HashMap<String, String>>> = LazyLock::new(|| Mutex::new(HashMap::new()));

fn slot(kind: SourceKind) -> u8 {
    kind as u8
}

pub fn set_profile_names(profile: &Profile) {
    let names = profile
        .input_device_settings
        .iter()
        .filter_map(|(key, settings)| {
            let name = settings.display_name.as_deref()?.trim();
            (!name.is_empty()).then(|| (key.clone(), name.to_string()))
        })
        .collect();
    *NAMES.lock() = names;
}

/// The user's name for the device, else its product name.
pub fn label_for(vendor_id: u16, product_id: u16, product: &str) -> String {
    NAMES
        .lock()
        .get(&format!("{vendor_id}-{product_id}"))
        .cloned()
        .unwrap_or_else(|| product.to_string())
}

pub fn note(kind: SourceKind, label: String) {
    RECENT.lock().insert(
        slot(kind),
        Recent {
            label,
            at: Instant::now(),
        },
    );
}

/// Device that reported `kind` input close to `at`, if any.
pub fn near(kind: SourceKind, at: Instant) -> Option<String> {
    let recent = RECENT.lock();
    let entry = recent.get(&slot(kind))?;
    let gap = if entry.at > at {
        entry.at - at
    } else {
        at - entry.at
    };
    (gap <= PAIR_WINDOW).then(|| entry.label.clone())
}

#[cfg(target_os = "macos")]
pub use mouse::ensure_started;

#[cfg(not(target_os = "macos"))]
pub fn ensure_started() {}

/// Mice / pointing devices (keyboards are watched by `platform::keyboards`).
#[cfg(target_os = "macos")]
mod mouse {
    use std::collections::HashMap;
    use std::ffi::c_void;
    use std::sync::{LazyLock, Once};
    use std::thread;

    use core_foundation::array::CFArray;
    use core_foundation::base::{CFType, TCFType};
    use core_foundation::dictionary::CFDictionary;
    use core_foundation::number::CFNumber;
    use core_foundation::runloop::{kCFRunLoopDefaultMode, CFRunLoop};
    use core_foundation::string::CFString;
    use parking_lot::Mutex;

    use super::{label_for, note, SourceKind};

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
        fn IOHIDManagerSetDeviceMatchingMultiple(manager: IOHIDManagerRef, multiple: *const c_void);
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

    const GENERIC_DESKTOP: u32 = 0x01;
    const BUTTON_PAGE: u32 = 0x09;
    const CONSUMER_PAGE: u32 = 0x0C;
    const AC_PAN: u32 = 0x238;

    static START: Once = Once::new();
    /// IOHIDDeviceRef → (vid, pid, product).
    static DEVICES: LazyLock<Mutex<HashMap<usize, (u16, u16, String)>>> =
        LazyLock::new(|| Mutex::new(HashMap::new()));

    /// Started the first time the viewer opens; stays up (callbacks only note a label).
    pub fn ensure_started() {
        START.call_once(|| {
            let _ = thread::Builder::new()
                .name("link-input-sources".into())
                .spawn(run);
        });
    }

    fn matching(usage: i32) -> CFDictionary<CFType, CFType> {
        CFDictionary::from_CFType_pairs(&[
            (
                CFString::new("DeviceUsagePage").as_CFType(),
                CFNumber::from(1i32).as_CFType(),
            ),
            (
                CFString::new("DeviceUsage").as_CFType(),
                CFNumber::from(usage).as_CFType(),
            ),
        ])
    }

    fn run() {
        unsafe {
            let manager = IOHIDManagerCreate(std::ptr::null(), 0);
            if manager.is_null() {
                log::warn!("input sources: IOHIDManagerCreate failed");
                return;
            }
            // Mouse and Pointer: trackballs, mice, the built-in trackpad.
            let list = CFArray::from_CFTypes(&[matching(2), matching(1)]);
            IOHIDManagerSetDeviceMatchingMultiple(manager, list.as_concrete_TypeRef() as *const c_void);
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
                log::warn!("input sources: IOHIDManagerOpen returned {rc:#x}");
            }
            CFRunLoop::run_current();
        }
    }

    fn property(device: IOHIDDeviceRef, key: &str) -> Option<CFType> {
        let key = CFString::new(key);
        let value = unsafe { IOHIDDeviceGetProperty(device, key.as_concrete_TypeRef() as _) };
        (!value.is_null()).then(|| unsafe { CFType::wrap_under_get_rule(value as _) })
    }

    extern "C" fn on_match(_: *mut c_void, _: IOReturn, _: *mut c_void, device: IOHIDDeviceRef) {
        let id = |key: &str| {
            property(device, key)
                .and_then(|v| v.downcast::<CFNumber>()?.to_i64())
                .and_then(|n| u16::try_from(n).ok())
                .unwrap_or(0)
        };
        let product = property(device, "Product")
            .and_then(|v| v.downcast::<CFString>().map(|s| s.to_string()))
            .map(|s| s.trim().to_string())
            .filter(|s| !s.is_empty())
            .unwrap_or_else(|| "Mouse".into());
        DEVICES
            .lock()
            .insert(device as usize, (id("VendorID"), id("ProductID"), product));
    }

    extern "C" fn on_remove(_: *mut c_void, _: IOReturn, _: *mut c_void, device: IOHIDDeviceRef) {
        DEVICES.lock().remove(&(device as usize));
    }

    extern "C" fn on_value(_: *mut c_void, _: IOReturn, _: *mut c_void, value: IOHIDValueRef) {
        let (page, usage, device, amount) = unsafe {
            let element = IOHIDValueGetElement(value);
            if element.is_null() {
                return;
            }
            (
                IOHIDElementGetUsagePage(element),
                IOHIDElementGetUsage(element),
                IOHIDElementGetDevice(element),
                IOHIDValueGetIntegerValue(value),
            )
        };
        let kind = match (page, usage) {
            (BUTTON_PAGE, _) => SourceKind::Button,
            (GENERIC_DESKTOP, 0x30 | 0x31 | 0x38) | (CONSUMER_PAGE, AC_PAN) if amount != 0 => {
                SourceKind::Pointer
            }
            _ => return,
        };
        let Some((vid, pid, product)) = DEVICES.lock().get(&(device as usize)).cloned() else {
            return;
        };
        note(kind, label_for(vid, pid, &product));
    }
}
