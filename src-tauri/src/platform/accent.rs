//! App accent color (set by the UI's hue picker) for native overlays.

use std::sync::atomic::{AtomicU32, Ordering};

static ACCENT_RGB: AtomicU32 = AtomicU32::new(0xC0_7B_C4);

pub fn set(rgb: u32) {
    ACCENT_RGB.store(rgb & 0xFF_FF_FF, Ordering::Relaxed);
}

/// Accent as 0.0–1.0 components.
pub fn components() -> (f64, f64, f64) {
    let rgb = ACCENT_RGB.load(Ordering::Relaxed);
    let channel = |shift: u32| f64::from((rgb >> shift) & 0xFF) / 255.0;
    (channel(16), channel(8), channel(0))
}
