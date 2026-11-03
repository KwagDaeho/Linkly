use std::collections::HashSet;
use std::sync::LazyLock;

use parking_lot::Mutex;

use crate::domain::modifier::{self, SIDE_MODIFIER_ORDER};

use super::keycodes::{
    key_activator_name, keycode_name, modifier_name, CGEventRef, CGEventGetFlags,
    CGEventGetIntegerValueField, KEYBOARD_EVENT_KEYCODE,
};
use super::super::emit::emit_chord;
use super::super::types::CaptureChord;

static HELD_MODS: LazyLock<Mutex<HashSet<String>>> =
    LazyLock::new(|| Mutex::new(HashSet::new()));
static HELD_KEYS: LazyLock<Mutex<Vec<String>>> = LazyLock::new(|| Mutex::new(Vec::new()));
static HELD_EXTRA: LazyLock<Mutex<Vec<String>>> = LazyLock::new(|| Mutex::new(Vec::new()));

pub fn clear_combo_held() {
    HELD_MODS.lock().clear();
    HELD_KEYS.lock().clear();
    HELD_EXTRA.lock().clear();
}

pub fn combo_held_parts() -> (Vec<String>, Vec<String>) {
    let held_mods = HELD_MODS.lock();
    let mods: Vec<String> = SIDE_MODIFIER_ORDER
        .iter()
        .filter(|m| held_mods.contains(**m))
        .map(|s| (*s).to_string())
        .collect();
    let keys: Vec<String> = HELD_KEYS.lock().clone();
    (mods, keys)
}

pub fn combo_held_snapshot() -> Vec<String> {
    let (mods, keys) = combo_held_parts();
    let mut chord = mods;
    chord.extend(keys);
    chord.extend(HELD_EXTRA.lock().clone());
    chord
}

fn is_modifier(name: &str) -> bool {
    modifier::is_modifier_name(name)
}

fn push_unique(vec: &mut Vec<String>, token: &str) {
    if !vec.iter().any(|t| t == token) {
        vec.push(token.to_string());
    }
}

pub fn note_capture_token(token: &str, down: bool) {
    if is_modifier(token) {
        return;
    }
    let mut extra = HELD_EXTRA.lock();
    if down {
        push_unique(&mut extra, token);
    } else {
        extra.retain(|t| t != token);
    }
}

pub(crate) fn note_modifier_flags_changed(event: CGEventRef) {
    let code = unsafe { CGEventGetIntegerValueField(event, KEYBOARD_EVENT_KEYCODE) } as u16;
    let Some((side, bit)) = modifier_name(code) else {
        return;
    };
    let flags = unsafe { CGEventGetFlags(event) };
    let down = flags & bit != 0;
    let mut held = HELD_MODS.lock();
    if down {
        held.insert(side.to_string());
    } else {
        held.remove(side);
    }
}

pub(crate) fn note_key_down(event: CGEventRef) {
    let code = unsafe { CGEventGetIntegerValueField(event, KEYBOARD_EVENT_KEYCODE) } as u16;
    if modifier_name(code).is_some() {
        return;
    }
    let name = keycode_name(code)
        .map(str::to_string)
        .unwrap_or_else(|| key_activator_name(code));
    push_unique(&mut HELD_KEYS.lock(), &name);
}

pub(crate) fn note_key_up(code: u16) {
    if modifier_name(code).is_some() {
        return;
    }
    if let Some(name) = keycode_name(code) {
        HELD_KEYS.lock().retain(|k| k != name);
    } else {
        let name = key_activator_name(code);
        HELD_KEYS.lock().retain(|k| k.as_str() != name);
    }
}

pub fn emit_combo_preview() {
    emit_chord(CaptureChord {
        escape: false,
        keys: combo_held_snapshot(),
    });
}
