//! Scoped Objective-C autorelease pool for long-lived background threads.
//!
//! HID worker, dispatch, and event-tap threads call AppKit / CoreGraphics APIs that
//! return autoreleased objects (`NSEvent`, `NSRunningApplication`, …). Without a pool
//! drained per iteration those objects live until the thread exits — i.e. forever.
//! Declare `let _pool = Pool::new();` at the top of each loop iteration / callback;
//! `continue` / `break` / early `return` drain it in LIFO order.

#[cfg(target_os = "macos")]
mod imp {
    use std::ffi::c_void;
    use std::marker::PhantomData;

    extern "C" {
        fn objc_autoreleasePoolPush() -> *mut c_void;
        fn objc_autoreleasePoolPop(context: *mut c_void);
    }

    /// Not `Send`: a pool must be popped on the thread that pushed it.
    pub struct Pool {
        context: *mut c_void,
        _not_send: PhantomData<*mut c_void>,
    }

    impl Pool {
        #[inline]
        pub fn new() -> Self {
            Self {
                context: unsafe { objc_autoreleasePoolPush() },
                _not_send: PhantomData,
            }
        }
    }

    impl Drop for Pool {
        #[inline]
        fn drop(&mut self) {
            unsafe { objc_autoreleasePoolPop(self.context) };
        }
    }
}

#[cfg(not(target_os = "macos"))]
mod imp {
    pub struct Pool;

    impl Pool {
        #[inline]
        pub fn new() -> Self {
            Self
        }
    }
}

pub use imp::Pool;
