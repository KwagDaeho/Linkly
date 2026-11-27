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

    use parking_lot::Mutex;

    use super::{label_for, note, SourceKind};
    use crate::platform::iohid::{self, IOHIDDeviceRef, IOHIDValueRef, IOReturn};

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

    fn run() {
        // Mouse and Pointer: trackballs, mice, the built-in trackpad.
        let matchings = [iohid::usage_matching(1, 2), iohid::usage_matching(1, 1)];
        if !iohid::run_manager("input sources", &matchings, on_match, on_remove, on_value) {
            log::warn!("input sources: IOHIDManagerCreate failed");
        }
    }

    extern "C" fn on_match(_: *mut c_void, _: IOReturn, _: *mut c_void, device: IOHIDDeviceRef) {
        let id = |key: &str| {
            iohid::device_int(device, key)
                .and_then(|n| u16::try_from(n).ok())
                .unwrap_or(0)
        };
        let product = iohid::device_string(device, "Product")
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
        let Some(iohid::HidValue {
            page,
            usage,
            device,
            value: amount,
        }) = iohid::read_value(value)
        else {
            return;
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
