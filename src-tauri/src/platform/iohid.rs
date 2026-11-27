//! Shared IOHIDManager plumbing (keyboard registry, input-source tracking).

use std::ffi::c_void;

use core_foundation::array::CFArray;
use core_foundation::base::{CFType, TCFType};
use core_foundation::dictionary::CFDictionary;
use core_foundation::number::CFNumber;
use core_foundation::runloop::{kCFRunLoopDefaultMode, CFRunLoop};
use core_foundation::string::CFString;

type IOHIDManagerRef = *mut c_void;
type IOHIDElementRef = *mut c_void;
pub type IOHIDDeviceRef = *mut c_void;
pub type IOHIDValueRef = *mut c_void;
pub type IOReturn = i32;
pub type DeviceCallback = extern "C" fn(*mut c_void, IOReturn, *mut c_void, IOHIDDeviceRef);
pub type ValueCallback = extern "C" fn(*mut c_void, IOReturn, *mut c_void, IOHIDValueRef);

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

/// Device matching dictionary for a top-level usage page / usage.
pub fn usage_matching(page: i32, usage: i32) -> CFDictionary<CFType, CFType> {
    CFDictionary::from_CFType_pairs(&[
        (
            CFString::new("DeviceUsagePage").as_CFType(),
            CFNumber::from(page).as_CFType(),
        ),
        (
            CFString::new("DeviceUsage").as_CFType(),
            CFNumber::from(usage).as_CFType(),
        ),
    ])
}

fn device_property(device: IOHIDDeviceRef, key: &str) -> Option<CFType> {
    let key = CFString::new(key);
    let value = unsafe { IOHIDDeviceGetProperty(device, key.as_concrete_TypeRef() as _) };
    (!value.is_null()).then(|| unsafe { CFType::wrap_under_get_rule(value as _) })
}

pub fn device_int(device: IOHIDDeviceRef, key: &str) -> Option<i64> {
    device_property(device, key)?.downcast::<CFNumber>()?.to_i64()
}

pub fn device_string(device: IOHIDDeviceRef, key: &str) -> Option<String> {
    device_property(device, key)?
        .downcast::<CFString>()
        .map(|s| s.to_string())
}

/// One input value from an `IOHIDManager` value callback.
pub struct HidValue {
    pub page: u32,
    pub usage: u32,
    pub device: IOHIDDeviceRef,
    pub value: isize,
}

/// `None` when the value has no element.
pub fn read_value(value: IOHIDValueRef) -> Option<HidValue> {
    unsafe {
        let element = IOHIDValueGetElement(value);
        if element.is_null() {
            return None;
        }
        Some(HidValue {
            page: IOHIDElementGetUsagePage(element),
            usage: IOHIDElementGetUsage(element),
            device: IOHIDElementGetDevice(element),
            value: IOHIDValueGetIntegerValue(value),
        })
    }
}

/// Create a manager for `matchings`, register callbacks, schedule it on the current run
/// loop, open it, and run that loop (blocks). Returns `false` only if the manager could
/// not be created (the caller logs that).
pub fn run_manager(
    tag: &str,
    matchings: &[CFDictionary<CFType, CFType>],
    on_match: DeviceCallback,
    on_remove: DeviceCallback,
    on_value: ValueCallback,
) -> bool {
    unsafe {
        // intentional: lives for the process (never released; callbacks stay registered).
        let manager = IOHIDManagerCreate(std::ptr::null(), 0);
        if manager.is_null() {
            return false;
        }
        let list = CFArray::from_CFTypes(matchings);
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
            // Without Input Monitoring the registry still fills; value callbacks stay silent.
            log::warn!("{tag}: IOHIDManagerOpen returned {rc:#x}");
        }
        CFRunLoop::run_current();
    }
    true
}
