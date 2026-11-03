//! Keyboard keystroke and media-key injection.

use core_graphics::event::{CGEvent, CGEventFlags, CGEventTapLocation};
use core_graphics::event_source::CGEventSource;

use crate::domain::profile::MouseClickButton;

use super::mouse::{mouse_down, mouse_up};
use super::source;

#[link(name = "CoreGraphics", kind = "framework")]
extern "C" {
    fn CGEventCreate(source: *mut std::ffi::c_void) -> *mut std::ffi::c_void;
    fn CGEventSetType(event: *mut std::ffi::c_void, event_type: u32);
    fn CGEventSetFlags(event: *mut std::ffi::c_void, flags: u64);
    fn CGEventSetIntegerValueField(event: *mut std::ffi::c_void, field: u32, value: i64);
    fn CGEventPost(tap: u32, event: *mut std::ffi::c_void);
    fn CGEventSourceCreate(state_id: u32) -> *mut std::ffi::c_void;
}

#[link(name = "CoreFoundation", kind = "framework")]
extern "C" {
    fn CFRelease(cf: *mut std::ffi::c_void);
}

fn key_code(name: &str) -> Option<u16> {
    let lower = name.to_ascii_lowercase();
    if let Some(rest) = lower.strip_prefix("keycode_") {
        return rest.parse().ok();
    }
    if let Some(rest) = lower.strip_prefix('f') {
        if let Ok(n) = rest.parse::<u32>() {
            return function_key_code(n);
        }
    }
    Some(match lower.as_str() {
        "a" => 0x00,
        "s" => 0x01,
        "d" => 0x02,
        "f" => 0x03,
        "h" => 0x04,
        "g" => 0x05,
        "z" => 0x06,
        "x" => 0x07,
        "c" => 0x08,
        "v" => 0x09,
        "b" => 0x0b,
        "q" => 0x0c,
        "w" => 0x0d,
        "e" => 0x0e,
        "r" => 0x0f,
        "y" => 0x10,
        "t" => 0x11,
        "1" => 0x12,
        "2" => 0x13,
        "3" => 0x14,
        "4" => 0x15,
        "5" => 0x17,
        "6" => 0x16,
        "=" | "equal" => 0x18,
        "9" => 0x19,
        "7" => 0x1a,
        "-" | "minus" => 0x1b,
        "8" => 0x1c,
        "0" => 0x1d,
        "]" => 0x1e,
        "o" => 0x1f,
        "u" => 0x20,
        "[" => 0x21,
        "i" => 0x22,
        "p" => 0x23,
        "l" => 0x25,
        "j" => 0x26,
        "'" | "quote" => 0x27,
        "k" => 0x28,
        ";" | "semicolon" => 0x29,
        "\\" | "backslash" => 0x2a,
        "," => 0x2b,
        "/" | "slash" => 0x2c,
        "n" => 0x2d,
        "m" => 0x2e,
        "." => 0x2f,
        "space" => 0x31,
        "tab" => 0x30,
        "return" | "enter" => 0x24,
        "escape" | "esc" => 0x35,
        "delete" | "backspace" => 0x33,
        "left" | "arrow_left" | "arrowleft" => 0x7b,
        "right" | "arrow_right" | "arrowright" => 0x7c,
        "down" | "arrow_down" | "arrowdown" => 0x7d,
        "up" | "arrow_up" | "arrowup" => 0x7e,
        "f1" => 0x7a,
        "f2" => 0x78,
        "f3" => 0x63,
        "f4" => 0x76,
        "f5" => 0x60,
        "f6" => 0x61,
        "f7" => 0x62,
        "f8" => 0x64,
        "f9" => 0x65,
        "f10" => 0x6d,
        "f11" => 0x67,
        "f12" => 0x6f,
        "forwarddelete" | "forward_delete" => 0x75,
        "home" => 0x73,
        "end" => 0x77,
        "pageup" | "page_up" => 0x74,
        "pagedown" | "page_down" => 0x79,
        "help" => 0x72,
        "insert" => 0x72,
        "clear" => 0x47,
        "capslock" | "caps_lock" => 0x39,
        "volume_up" | "sound_up" => 0x48,
        "volume_down" | "sound_down" => 0x49,
        "mute" | "sound_mute" => 0x4a,
        "play" | "play_pause" | "playpause" => 0x42,
        "next" | "next_track" | "nexttrack" => 0x43,
        "previous" | "previous_track" | "previoustrack" => 0x44,
        _ => return None,
    })
}

fn function_key_code(n: u32) -> Option<u16> {
    Some(match n {
        1 => 0x7a,
        2 => 0x78,
        3 => 0x63,
        4 => 0x76,
        5 => 0x60,
        6 => 0x61,
        7 => 0x62,
        8 => 0x64,
        9 => 0x65,
        10 => 0x6d,
        11 => 0x67,
        12 => 0x6f,
        13 => 0x69,
        14 => 0x6b,
        15 => 0x71,
        16 => 0x6a,
        17 => 0x40,
        18 => 0x4f,
        19 => 0x50,
        20 => 0x5a,
        _ => return None,
    })
}

fn is_modifier(name: &str) -> Option<CGEventFlags> {
    match name.to_ascii_lowercase().as_str() {
        "meta" | "cmd" | "command" | "left_meta" | "right_meta" | "leftmeta"
        | "rightmeta" | "left_command" | "right_command" => {
            Some(CGEventFlags::CGEventFlagCommand)
        }
        "alt" | "option" | "left_alt" | "right_alt" | "left_option" | "right_option"
        | "leftoption" | "rightoption" => Some(CGEventFlags::CGEventFlagAlternate),
        "ctrl" | "control" | "left_ctrl" | "right_ctrl" | "left_control"
        | "right_control" | "leftcontrol" | "rightcontrol" => {
            Some(CGEventFlags::CGEventFlagControl)
        }
        "shift" | "left_shift" | "right_shift" | "leftshift" | "rightshift" => {
            Some(CGEventFlags::CGEventFlagShift)
        }
        "fn" | "function" => Some(CGEventFlags::CGEventFlagSecondaryFn),
        _ => None,
    }
}

/// Physical keycodes for modifiers (left-side). Needed so OS modifier state
/// does not stick after a chord — flag-only events leave Control "down",
/// which turns the next left-click into a right-click on macOS.
fn modifier_keycode(flag: CGEventFlags) -> Option<u16> {
    if flag.contains(CGEventFlags::CGEventFlagControl) {
        Some(0x3b) // Left Control
    } else if flag.contains(CGEventFlags::CGEventFlagAlternate) {
        Some(0x3a) // Left Option
    } else if flag.contains(CGEventFlags::CGEventFlagShift) {
        Some(0x38) // Left Shift
    } else if flag.contains(CGEventFlags::CGEventFlagCommand) {
        Some(0x37) // Left Command
    } else if flag.contains(CGEventFlags::CGEventFlagSecondaryFn) {
        Some(0x3f) // Fn
    } else {
        None
    }
}

fn modifier_keycode_for_name(name: &str) -> Option<u16> {
    match name.to_ascii_lowercase().as_str() {
        "leftcontrol" | "left_control" | "left_ctrl" => Some(0x3b),
        "rightcontrol" | "right_control" | "right_ctrl" => Some(0x3e),
        "leftoption" | "left_option" | "left_alt" => Some(0x3a),
        "rightoption" | "right_option" | "right_alt" => Some(0x3d),
        "leftshift" | "left_shift" => Some(0x38),
        "rightshift" | "right_shift" => Some(0x3c),
        "leftmeta" | "left_meta" | "left_command" => Some(0x37),
        "rightmeta" | "right_meta" | "right_command" => Some(0x36),
        _ => modifier_keycode(is_modifier(name)?),
    }
}

pub(super) fn post_key(src: &CGEventSource, code: u16, key_down: bool, flags: CGEventFlags) {
    if let Ok(e) = CGEvent::new_keyboard_event(src.clone(), code, key_down) {
        e.set_flags(flags);
        e.post(CGEventTapLocation::HID);
    }
}

fn plist_modifier_flags(mod_plist: u32) -> CGEventFlags {
    let mut flags = CGEventFlags::empty();
    if mod_plist & 131_072 != 0 {
        flags.insert(CGEventFlags::CGEventFlagShift);
    }
    if mod_plist & 262_144 != 0 {
        flags.insert(CGEventFlags::CGEventFlagControl);
    }
    if mod_plist & 524_288 != 0 {
        flags.insert(CGEventFlags::CGEventFlagAlternate);
    }
    if mod_plist & 1_048_576 != 0 {
        flags.insert(CGEventFlags::CGEventFlagCommand);
    }
    if flags.is_empty() && mod_plist != 0 {
        return CGEventFlags::from_bits_truncate(mod_plist as u64);
    }
    flags
}

/// Post one key tap using modifier bitmask from `AppleSymbolicHotKeys` parameter 3.
pub(super) fn tap_key_with_modifier_plist(key_code: u16, mod_plist: u32) {
    let Some(src) = source() else {
        return;
    };
    let flags = plist_modifier_flags(mod_plist);
    let mut held = CGEventFlags::empty();
    let mod_steps: [(CGEventFlags, u16); 4] = [
        (CGEventFlags::CGEventFlagShift, 0x38),
        (CGEventFlags::CGEventFlagControl, 0x3b),
        (CGEventFlags::CGEventFlagAlternate, 0x3a),
        (CGEventFlags::CGEventFlagCommand, 0x37),
    ];
    for (flag, code) in mod_steps {
        if flags.contains(flag) {
            held.insert(flag);
            post_key(&src, code, true, held);
        }
    }
    post_key(&src, key_code, true, flags);
    post_key(&src, key_code, false, flags);
    for (flag, code) in mod_steps.iter().rev() {
        if flags.contains(*flag) {
            held.remove(*flag);
            post_key(&src, *code, false, held);
        }
    }
}

fn mouse_button_from_token(name: &str) -> Option<MouseClickButton> {
    match name {
        "MouseLeft" => Some(MouseClickButton::Left),
        "MouseRight" => Some(MouseClickButton::Right),
        "MouseMiddle" => Some(MouseClickButton::Middle),
        "MouseBack" => Some(MouseClickButton::Back),
        "MouseForward" => Some(MouseClickButton::Forward),
        _ => {
            let rest = name.strip_prefix("Button")?;
            let karabiner: u8 = rest.parse().ok()?;
            if karabiner <= 5 {
                return None;
            }
            Some(MouseClickButton::Other {
                number: karabiner.saturating_sub(1),
            })
        }
    }
}

fn keystroke_with_source(src: &CGEventSource, keys: &[String]) {
    let mut flags = CGEventFlags::empty();
    let mut mod_keys: Vec<String> = Vec::new();
    let mut main_key: Option<u16> = None;
    let mut main_mouse: Option<MouseClickButton> = None;
    for k in keys {
        if is_modifier(k).is_some() {
            if !mod_keys.iter().any(|existing| existing.eq_ignore_ascii_case(k)) {
                mod_keys.push(k.clone());
                if let Some(f) = is_modifier(k) {
                    flags.insert(f);
                }
            }
        } else if let Some(code) = key_code(k) {
            main_key = Some(code);
            main_mouse = None;
        } else if let Some(button) = mouse_button_from_token(k) {
            main_mouse = Some(button);
            main_key = None;
        }
    }

    let mut accumulated = CGEventFlags::empty();
    for name in &mod_keys {
        if let Some(mk) = modifier_keycode_for_name(name) {
            if let Some(f) = is_modifier(name) {
                accumulated.insert(f);
            }
            post_key(src, mk, true, accumulated);
        }
    }

    if let Some(button) = main_mouse {
        let _ = src;
        mouse_down(&button);
        mouse_up(&button);
    } else if let Some(code) = main_key {
        post_key(src, code, true, flags);
        post_key(src, code, false, flags);
    } else {
        for name in mod_keys.iter().rev() {
            if let Some(mk) = modifier_keycode_for_name(name) {
                if let Some(f) = is_modifier(name) {
                    accumulated.remove(f);
                }
                post_key(src, mk, false, accumulated);
            }
        }
        return;
    }

    for name in mod_keys.iter().rev() {
        if let Some(mk) = modifier_keycode_for_name(name) {
            if let Some(f) = is_modifier(name) {
                accumulated.remove(f);
            }
            post_key(src, mk, false, accumulated);
        }
    }
}

pub(super) fn keystroke(keys: &[String]) {
    let Some(src) = super::source() else {
        return;
    };
    keystroke_with_source(&src, keys);
}

/// Keystroke via a private event source — ignores combined-session modifier state
/// so a held Control/Option does not pollute Cmd+Space etc.
pub fn keystroke_isolated(keys: &[String]) {
    use core_graphics::event_source::CGEventSourceStateID;
    let Some(src) = CGEventSource::new(CGEventSourceStateID::Private)
        .ok()
        .or_else(super::source)
    else {
        return;
    };
    keystroke_with_source(&src, keys);
}

/// Release tracked chord modifiers/keys so injected actions are not polluted
/// (e.g. Control held → right-click; Control+Command+Space → emoji picker).
pub fn release_chord_hold(modifiers: &[String], keys: &[String]) {
    let Some(src) = super::source() else {
        return;
    };
    let mut accumulated = CGEventFlags::empty();
    for name in modifiers {
        if let Some(flag) = is_modifier(name) {
            accumulated.insert(flag);
        }
    }
    for name in keys.iter().rev() {
        if is_modifier(name).is_some() {
            continue;
        }
        if let Some(code) = key_code(name) {
            post_key(&src, code, false, accumulated);
        }
    }
    for name in modifiers.iter().rev() {
        let Some(code) = modifier_keycode_for_name(name) else {
            continue;
        };
        if let Some(flag) = is_modifier(name) {
            accumulated.remove(flag);
        }
        post_key(&src, code, false, accumulated);
    }
}

/// NX auxiliary / media keys via NSEvent (shows volume HUD + Now Playing).
/// Raw CGEventCreate is only a fallback — it often never reaches the OSD.
fn post_nx_key(key_type: i64) {
    use cocoa::appkit::{NSEvent, NSEventModifierFlags, NSEventSubtype, NSSystemDefined};
    use cocoa::base::{id, nil};
    use cocoa::foundation::NSPoint;

    const TAP_HID: u32 = 0;

    unsafe {
        for down in [true, false] {
            let state: i64 = if down { 0xa } else { 0xb };
            let flags = NSEventModifierFlags::from_bits_truncate((state << 8) as u64);
            let data1 = (key_type << 16) | (state << 8);
            let ns: id = NSEvent::otherEventWithType_location_modifierFlags_timestamp_windowNumber_context_subtype_data1_data2_(
                nil,
                NSSystemDefined,
                NSPoint::new(0.0, 0.0),
                flags,
                0.0,
                0,
                nil,
                // NX_SUBTYPE_AUX_CONTROL_BUTTONS == 8 (named ScreenChanged in cocoa)
                NSEventSubtype::NSScreenChangedEventType,
                data1,
                -1,
            );
            if ns != nil {
                let cg: *mut std::ffi::c_void = NSEvent::CGEvent(ns);
                if !cg.is_null() {
                    CGEventPost(TAP_HID, cg);
                }
            } else {
                let src = CGEventSourceCreate(1); // HIDSystemState
                if src.is_null() {
                    log::warn!("post_nx_key: CGEventSourceCreate failed");
                    continue;
                }
                let e = CGEventCreate(src);
                if !e.is_null() {
                    CGEventSetType(e, 14);
                    CGEventSetFlags(e, (state << 8) as u64);
                    CGEventSetIntegerValueField(e, 99, 8);
                    CGEventSetIntegerValueField(e, 149, data1);
                    CGEventSetIntegerValueField(e, 150, -1);
                    CGEventPost(TAP_HID, e);
                    CFRelease(e);
                }
                CFRelease(src);
            }
            std::thread::sleep(std::time::Duration::from_millis(30));
        }
    }
}

pub(super) fn media_volume_up() {
    post_nx_key(0); // NX_KEYTYPE_SOUND_UP — system volume HUD
}
pub(super) fn media_volume_down() {
    post_nx_key(1); // NX_KEYTYPE_SOUND_DOWN
}
pub(super) fn media_mute() {
    post_nx_key(7); // NX_KEYTYPE_MUTE
}
pub(super) fn media_play_pause() {
    // NX reaches system Now Playing (browser etc.). Do not also AppleScript
    // Music/Spotify — that double-toggles and looks like "nothing happened".
    post_nx_key(16); // NX_KEYTYPE_PLAY
}
pub(super) fn media_next() {
    post_nx_key(17); // NX_KEYTYPE_NEXT
}
pub(super) fn media_previous() {
    post_nx_key(18); // NX_KEYTYPE_PREVIOUS
}
