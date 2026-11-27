//! Click-through, full-screen overlay that draws the gesture trail while drawing.

use cocoa::appkit::{NSColor, NSWindow};
use cocoa::base::{id, nil, YES};
use cocoa::foundation::{NSPoint, NSRect};
use objc::declare::ClassDecl;
use objc::runtime::{Class, Object, Sel};
use objc::{class, msg_send, sel, sel_impl};
use parking_lot::Mutex;
use std::sync::atomic::{AtomicBool, Ordering};
use std::thread;
use std::time::Duration;

use crate::platform::app_bus;

use super::overlay_panel::{
    alloc_overlay_panel, close_overlay_panel, order_overlay_front,
    register_nonactivating_panel_class, release_overlay_activation_policy,
    retain_overlay_activation_policy, screen_frames, stop_raise_loop, RAISE_INTERVAL_MS,
};

const STROKE_WIDTH: f64 = 4.0;
const VIEW_CLASS: &str = "LinklyGestureTrailView";
const PANEL_CLASS: &str = "LinklyGestureTrailPanel";

static WINDOWS: Mutex<Vec<usize>> = Mutex::new(Vec::new());
/// Trail in AppKit global coordinates (origin bottom-left of the primary screen).
static POINTS: Mutex<Vec<NSPoint>> = Mutex::new(Vec::new());
static RAISING: AtomicBool = AtomicBool::new(false);

pub fn show() {
    POINTS.lock().clear();
    app_bus::run_on_main(|| unsafe { show_on_main() });
}

pub fn hide() {
    stop_raise_loop(&RAISING);
    app_bus::run_on_main(|| unsafe { hide_on_main() });
}

/// Append the current cursor position to the trail.
pub fn track_cursor() {
    app_bus::run_on_main(|| unsafe {
        let loc = cocoa::appkit::NSEvent::mouseLocation(nil);
        let mut points = POINTS.lock();
        if let Some(last) = points.last() {
            if (loc.x - last.x).hypot(loc.y - last.y) < 1.0 {
                return;
            }
        }
        points.push(loc);
        drop(points);
        redraw_on_main();
    });
}

unsafe fn redraw_on_main() {
    for ptr in WINDOWS.lock().iter().copied() {
        let view: id = (ptr as id).contentView();
        if !view.is_null() {
            let _: () = msg_send![view, setNeedsDisplay: YES];
        }
    }
}

unsafe fn show_on_main() {
    hide_on_main();
    retain_overlay_activation_policy();
    let panel_class = register_nonactivating_panel_class(PANEL_CLASS);
    let view_class = view_class();
    let mut handles = Vec::new();
    for frame in screen_frames() {
        let win = alloc_overlay_panel(panel_class, frame);
        if win.is_null() {
            continue;
        }
        let view: id = msg_send![view_class, alloc];
        let view: id = msg_send![view, initWithFrame: frame];
        win.setContentView_(view);
        order_overlay_front(win);
        handles.push(win as usize);
    }
    if handles.is_empty() {
        release_overlay_activation_policy();
        return;
    }
    *WINDOWS.lock() = handles;
    start_raise_loop();
}

fn start_raise_loop() {
    if RAISING.swap(true, Ordering::SeqCst) {
        return;
    }
    thread::spawn(|| {
        while RAISING.load(Ordering::SeqCst) {
            app_bus::run_on_main(|| unsafe {
                for ptr in WINDOWS.lock().iter().copied() {
                    order_overlay_front(ptr as id);
                }
            });
            thread::sleep(Duration::from_millis(RAISE_INTERVAL_MS));
        }
    });
}

unsafe fn hide_on_main() {
    POINTS.lock().clear();
    let windows: Vec<usize> = WINDOWS.lock().drain(..).collect();
    if windows.is_empty() {
        return;
    }
    for ptr in windows {
        close_overlay_panel(ptr as id);
    }
    release_overlay_activation_policy();
}

/// Synchronous teardown on app exit (main thread).
pub fn tear_down_on_main() {
    stop_raise_loop(&RAISING);
    unsafe { hide_on_main() };
}

fn view_class() -> &'static Class {
    use std::sync::OnceLock;
    static CLASS: OnceLock<&'static Class> = OnceLock::new();
    CLASS.get_or_init(|| {
        if let Some(cls) = Class::get(VIEW_CLASS) {
            return cls;
        }
        let mut decl = ClassDecl::new(VIEW_CLASS, class!(NSView)).expect(VIEW_CLASS);
        unsafe {
            decl.add_method(
                sel!(drawRect:),
                draw_rect as extern "C" fn(&Object, Sel, NSRect),
            );
        }
        decl.register()
    })
}

extern "C" fn draw_rect(this: &Object, _sel: Sel, _rect: NSRect) {
    let points = POINTS.lock().clone();
    if points.len() < 2 {
        return;
    }
    unsafe {
        let win: id = msg_send![this, window];
        if win.is_null() {
            return;
        }
        // View coordinates = global AppKit coordinates minus the screen origin.
        let frame: NSRect = msg_send![win, frame];
        let local = |p: NSPoint| NSPoint::new(p.x - frame.origin.x, p.y - frame.origin.y);
        let (r, g, b) = crate::platform::accent::components();
        let color = NSColor::colorWithRed_green_blue_alpha_(nil, r, g, b, 0.9);
        let _: () = msg_send![color, setStroke];
        let path: id = msg_send![class!(NSBezierPath), bezierPath];
        let _: () = msg_send![path, setLineWidth: STROKE_WIDTH];
        let _: () = msg_send![path, setLineCapStyle: 1i64];
        let _: () = msg_send![path, setLineJoinStyle: 1i64];
        let _: () = msg_send![path, moveToPoint: local(points[0])];
        for point in points.iter().skip(1) {
            let _: () = msg_send![path, lineToPoint: local(*point)];
        }
        let _: () = msg_send![path, stroke];
    }
}
