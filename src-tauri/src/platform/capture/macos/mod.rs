#[cfg(target_os = "macos")]
mod combo;
#[cfg(target_os = "macos")]
mod keycodes;
#[cfg(target_os = "macos")]
mod tap;
#[cfg(target_os = "macos")]
mod viewer;

#[cfg(target_os = "macos")]
pub(crate) use combo::{emit_combo_preview, note_capture_token};
pub use combo::{clear_combo_held, combo_held_parts};

#[cfg(target_os = "macos")]
pub(crate) fn refresh_combo_preview() {
    combo::emit_combo_preview();
}

#[cfg(target_os = "macos")]
pub(crate) fn reenable_key_capture_tap() {
    use core_foundation::mach_port::CFMachPortRef;
    use std::ffi::c_void;
    use std::sync::atomic::Ordering;

    use super::session::KEY_CAPTURE_TAP_PORT;

    #[link(name = "CoreGraphics", kind = "framework")]
    extern "C" {
        fn CGEventTapEnable(tap: CFMachPortRef, enable: bool);
    }

    let port = KEY_CAPTURE_TAP_PORT.load(Ordering::SeqCst);
    if !port.is_null() {
        unsafe { CGEventTapEnable(port as CFMachPortRef, true) };
    }
}

#[cfg(target_os = "macos")]
mod tap_thread {
    use core_foundation::runloop::CFRunLoop;
    use parking_lot::Mutex;
    use std::sync::atomic::{AtomicPtr, Ordering};
    use std::thread::JoinHandle;

    pub(super) static TAP_RUNLOOP: AtomicPtr<std::ffi::c_void> =
        AtomicPtr::new(std::ptr::null_mut());
    pub(super) static TAP_THREAD: Mutex<Option<JoinHandle<()>>> = Mutex::new(None);
}

#[cfg(target_os = "macos")]
pub fn ensure_tap_thread() {
    use core_foundation::base::TCFType;
    use core_foundation::mach_port::{CFMachPort, CFMachPortRef};
    use core_foundation::runloop::{kCFRunLoopCommonModes, CFRunLoop};
    use std::ffi::c_void;
    use std::sync::atomic::Ordering;

    use super::session::{KEY_CAPTURE_TAP_PORT, TAP_STARTED};
    use tap_thread::{TAP_RUNLOOP, TAP_THREAD};
    use keycodes::{
        mask_bit, CGEventMask, CGEventRef, CGEventTapProxy, LEFT_DOWN, LEFT_UP, OTHER_DOWN,
        OTHER_UP, RIGHT_DOWN, RIGHT_UP, KEY_DOWN, KEY_UP, FLAGS_CHANGED,
    };
    use tap::tap_callback;

    type CGEventTapCallback = unsafe extern "C" fn(
        CGEventTapProxy,
        u32,
        CGEventRef,
        *mut c_void,
    ) -> CGEventRef;

    #[link(name = "CoreGraphics", kind = "framework")]
    extern "C" {
        fn CGEventTapCreate(
            tap: u32,
            place: u32,
            options: u32,
            eventsOfInterest: CGEventMask,
            callback: CGEventTapCallback,
            userInfo: *mut c_void,
        ) -> CFMachPortRef;
        fn CGEventTapEnable(tap: CFMachPortRef, enable: bool);
    }

    if TAP_STARTED.swap(true, Ordering::SeqCst) {
        return;
    }

    let handle = std::thread::Builder::new()
        .name("key-capture-tap".into())
        .spawn(|| {
            const SCROLL_WHEEL: u32 = 22;
            let events = mask_bit(KEY_DOWN)
                | mask_bit(KEY_UP)
                | mask_bit(FLAGS_CHANGED)
                | mask_bit(LEFT_DOWN)
                | mask_bit(LEFT_UP)
                | mask_bit(RIGHT_DOWN)
                | mask_bit(RIGHT_UP)
                | mask_bit(OTHER_DOWN)
                | mask_bit(OTHER_UP)
                | mask_bit(SCROLL_WHEEL);
            let port = unsafe {
                CGEventTapCreate(
                    0,
                    0,
                    0,
                    events,
                    tap_callback,
                    std::ptr::null_mut(),
                )
            };
            if port.is_null() {
                log::warn!("key-capture tap failed — grant Accessibility / Input Monitoring");
                TAP_STARTED.store(false, Ordering::SeqCst);
                return;
            }

            KEY_CAPTURE_TAP_PORT.store(port as *mut c_void, Ordering::SeqCst);

            let mach = unsafe { CFMachPort::wrap_under_create_rule(port) };
            match mach.create_runloop_source(0) {
                Ok(source) => {
                    let rl = CFRunLoop::get_current();
                    TAP_RUNLOOP.store(
                        rl.as_CFTypeRef() as *mut c_void,
                        Ordering::SeqCst,
                    );
                    rl.add_source(&source, unsafe { kCFRunLoopCommonModes });
                    unsafe { CGEventTapEnable(port, true) };
                    log::info!("key-capture event tap ready");
                    CFRunLoop::run_current();
                    let _keep = (mach, source);
                }
                Err(()) => {
                    log::warn!("key-capture tap runloop source failed");
                }
            }

            TAP_RUNLOOP.store(std::ptr::null_mut(), Ordering::SeqCst);
            KEY_CAPTURE_TAP_PORT.store(std::ptr::null_mut(), Ordering::SeqCst);
            TAP_STARTED.store(false, Ordering::SeqCst);
        })
        .expect("spawn key-capture-tap");
    *TAP_THREAD.lock() = Some(handle);
}

#[cfg(target_os = "macos")]
pub fn stop_tap_thread() {
    use core_foundation::base::TCFType;
    use core_foundation::runloop::{CFRunLoop, CFRunLoopRef};
    use std::sync::atomic::Ordering;

    use tap_thread::{TAP_RUNLOOP, TAP_THREAD};

    let rl = TAP_RUNLOOP.load(Ordering::SeqCst);
    if !rl.is_null() {
        unsafe {
            let run_loop =
                CFRunLoop::wrap_under_get_rule(rl as CFRunLoopRef);
            run_loop.stop();
        }
    }
    if let Some(handle) = TAP_THREAD.lock().take() {
        let _ = handle.join();
    }
}

#[cfg(not(target_os = "macos"))]
pub fn ensure_tap_thread() {}

#[cfg(not(target_os = "macos"))]
pub fn stop_tap_thread() {}

#[cfg(not(target_os = "macos"))]
pub fn clear_combo_held() {}

#[cfg(not(target_os = "macos"))]
pub fn combo_held_parts() -> (Vec<String>, Vec<String>) {
    (Vec::new(), Vec::new())
}
