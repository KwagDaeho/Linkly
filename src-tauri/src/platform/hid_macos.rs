//! macOS IORegistry helpers for HID path validity and transport type.

use crate::domain::device::HidTransport;

type io_object_t = u32;
type mach_port_t = u32;
type CFTypeRef = *const std::ffi::c_void;
type CFStringRef = *const std::ffi::c_void;
type CFAllocatorRef = *const std::ffi::c_void;
type CFMutableDictionaryRef = *mut std::ffi::c_void;
type IOOptionBits = u32;

#[link(name = "IOKit", kind = "framework")]
extern "C" {
    fn IORegistryEntryIDMatching(entry_id: u64) -> CFMutableDictionaryRef;
    fn IOServiceGetMatchingService(main_port: mach_port_t, matching: CFTypeRef) -> io_object_t;
    fn IORegistryEntryGetParentEntry(
        entry: io_object_t,
        plane: *const i8,
        parent: *mut io_object_t,
    ) -> i32;
    fn IORegistryEntryCreateCFProperty(
        entry: io_object_t,
        key: CFStringRef,
        allocator: CFAllocatorRef,
        options: IOOptionBits,
    ) -> CFTypeRef;
    fn IOObjectRelease(object: io_object_t) -> i32;
}

fn parse_registry_entry_id(path: &str) -> Option<u64> {
    const PREFIX: &str = "DevSrvsID:";
    if let Some(rest) = path.strip_prefix(PREFIX) {
        return rest.parse().ok();
    }
    path.parse().ok()
}

fn registry_entry_for_path(path: &str) -> Option<io_object_t> {
    let entry_id = parse_registry_entry_id(path)?;
    unsafe {
        let matching = IORegistryEntryIDMatching(entry_id);
        if matching.is_null() {
            return None;
        }
        // IOServiceGetMatchingService consumes the matching dictionary reference.
        let service = IOServiceGetMatchingService(0, matching as CFTypeRef);
        if service == 0 {
            return None;
        }
        Some(service)
    }
}

/// hidapi `path` on macOS is `DevSrvsID:<registry entry id>`.
pub fn registry_entry_online(path: &str) -> bool {
    registry_entry_for_path(path).is_some()
}

pub fn registry_transport(path: &str) -> HidTransport {
    let Some(mut entry) = registry_entry_for_path(path) else {
        return HidTransport::Unknown;
    };
    unsafe {
        for _ in 0..12 {
            if let Some(raw) = registry_string_property(entry, "Transport") {
                let parsed = HidTransport::from_registry_str(&raw);
                if parsed != HidTransport::Unknown {
                    IOObjectRelease(entry);
                    return parsed;
                }
            }
            let mut parent: io_object_t = 0;
            let kr = IORegistryEntryGetParentEntry(entry, c"IOService".as_ptr(), &mut parent);
            IOObjectRelease(entry);
            if kr != 0 || parent == 0 {
                return HidTransport::Unknown;
            }
            entry = parent;
        }
        IOObjectRelease(entry);
        HidTransport::Unknown
    }
}

unsafe fn registry_string_property(entry: io_object_t, key: &str) -> Option<String> {
    use core_foundation::base::{CFType, TCFType};
    use core_foundation::string::CFString;

    let key_cf = CFString::new(key);
    let value = IORegistryEntryCreateCFProperty(
        entry,
        key_cf.as_concrete_TypeRef() as CFStringRef,
        std::ptr::null(),
        0,
    );
    if value.is_null() {
        return None;
    }
    let typed = CFType::wrap_under_create_rule(value as _);
    typed.downcast::<CFString>().map(|s| s.to_string())
}
