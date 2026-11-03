//! Cycle keyboard input sources in **Input menu order**.
//!
//! macOS exposes this as symbolic hotkeys 60/61 (System Settings → Keyboard → Shortcuts → Input Sources).
//! That path works from background injectors and with CJK IMEs; raw `TISSelectInputSource` often fails
//! (non-selectable parent IME, paramErr -50) or only updates the menu bar in other apps.

use core_foundation::array::CFArray;
use core_foundation::base::{CFRelease, CFRetain, CFTypeRef, TCFType};
use core_foundation::boolean::CFBoolean;
use core_foundation::dictionary::CFDictionaryRef;
use core_foundation::string::{CFString, CFStringRef};
use serde::Deserialize;

use super::keyboard;

type TISInputSourceRef = CFTypeRef;

const NO_ERR: i32 = 0;
/// AppleSymbolicHotKeys — "Select the previous input source in Input menu".
const HOTKEY_PREVIOUS: u32 = 60;
/// "Select the next source in Input menu".
const HOTKEY_NEXT: u32 = 61;

#[link(name = "Carbon", kind = "framework")]
extern "C" {
    fn TISCopyCurrentKeyboardInputSource() -> TISInputSourceRef;
    fn TISCreateInputSourceList(
        properties: CFDictionaryRef,
        include_all_installed: u8,
    ) -> CFTypeRef;
    fn TISSelectInputSource(source: TISInputSourceRef) -> i32;
    fn TISGetInputSourceProperty(source: TISInputSourceRef, key: CFStringRef) -> CFTypeRef;
}

#[derive(Debug, Deserialize)]
struct SymbolicHotKeyEntry {
    enabled: Option<bool>,
    value: Option<SymbolicHotKeyValue>,
}

#[derive(Debug, Deserialize)]
struct SymbolicHotKeyValue {
    parameters: Option<Vec<i64>>,
}

fn property_bool(source: TISInputSourceRef, key: &str) -> bool {
    if source.is_null() {
        return false;
    }
    unsafe {
        let key_ref = CFString::new(key);
        let value = TISGetInputSourceProperty(source, key_ref.as_concrete_TypeRef());
        if value.is_null() {
            return false;
        }
        CFBoolean::wrap_under_get_rule(value as _).into()
    }
}

fn property_string(source: TISInputSourceRef, key: &str) -> Option<String> {
    if source.is_null() {
        return None;
    }
    unsafe {
        let key_ref = CFString::new(key);
        let value = TISGetInputSourceProperty(source, key_ref.as_concrete_TypeRef());
        if value.is_null() {
            return None;
        }
        let s = CFString::wrap_under_get_rule(value as CFStringRef);
        Some(s.to_string())
    }
}

fn is_selectable_menu_source(source: TISInputSourceRef) -> bool {
    if !property_bool(source, "TISInputSourceIsEnabled") {
        return false;
    }
    if !property_bool(source, "TISInputSourceIsSelectCapable") {
        return false;
    }
    let Some(category) = property_string(source, "TISInputSourceCategory") else {
        return false;
    };
    matches!(
        category.as_str(),
        "TISCategoryKeyboardInputSource" | "TISCategoryInputMethod"
    )
}

fn load_symbolic_hotkey(id: u32) -> Option<(u16, u32)> {
    let path = dirs::home_dir()?.join("Library/Preferences/com.apple.symbolichotkeys.plist");
    let output = std::process::Command::new("/usr/bin/plutil")
        .args(["-convert", "json", "-o", "-", "--"])
        .arg(&path)
        .output()
        .ok()?;
    if !output.status.success() {
        return None;
    }
    let root: serde_json::Value = serde_json::from_slice(&output.stdout).ok()?;
    let entry_val = root.get("AppleSymbolicHotKeys")?.get(id.to_string())?;
    let entry: SymbolicHotKeyEntry = serde_json::from_value(entry_val.clone()).ok()?;
    if !entry.enabled.unwrap_or(false) {
        log::warn!("input source: symbolic hotkey {id} is disabled in System Settings");
        return None;
    }
    let params = entry.value?.parameters?;
    let key_code = u16::try_from(*params.get(1)?).ok()?;
    let mods = u32::try_from(*params.get(2)?).ok()?;
    Some((key_code, mods))
}

fn applescript_modifiers(mod_plist: u32) -> Vec<&'static str> {
    let mut out = Vec::new();
    if mod_plist & 131_072 != 0 {
        out.push("shift down");
    }
    if mod_plist & 262_144 != 0 {
        out.push("control down");
    }
    if mod_plist & 524_288 != 0 {
        out.push("option down");
    }
    if mod_plist & 1_048_576 != 0 {
        out.push("command down");
    }
    out
}

fn run_osascript(script: &str) -> bool {
    match std::process::Command::new("/usr/bin/osascript")
        .args(["-e", script])
        .output()
    {
        Ok(out) if out.status.success() => true,
        Ok(out) => {
            log::warn!(
                "input source osascript failed: {}",
                String::from_utf8_lossy(&out.stderr)
            );
            false
        }
        Err(err) => {
            log::warn!("input source osascript spawn failed: {err}");
            false
        }
    }
}

fn trigger_input_menu_hotkey(next: bool) -> bool {
    let id = if next { HOTKEY_NEXT } else { HOTKEY_PREVIOUS };
    let Some((key_code, mod_plist)) = load_symbolic_hotkey(id) else {
        return false;
    };
    let mods = applescript_modifiers(mod_plist);
    let ok = if mods.is_empty() && mod_plist == 0 {
        run_osascript(&format!(
            "tell application \"System Events\" to key code {key_code}"
        ))
    } else if !mods.is_empty() {
        run_osascript(&format!(
            "tell application \"System Events\" to key code {key_code} using {{{}}}",
            mods.join(", ")
        ))
    } else {
        false
    };
    if ok {
        log::info!("input source: symbolic hotkey {id} (key {key_code}) via System Events");
        return true;
    }
    keyboard::tap_key_with_modifier_plist(key_code, mod_plist);
    log::info!("input source: symbolic hotkey {id} (key {key_code}) via CGEvent");
    true
}

fn select_relative_tis(step: isize) {
    unsafe {
        let list = TISCreateInputSourceList(std::ptr::null(), 0);
        if list.is_null() {
            log::warn!("TISCreateInputSourceList returned null");
            return;
        }
        let array = CFArray::<CFTypeRef>::wrap_under_create_rule(list as _);
        if array.is_empty() {
            log::warn!("TISCreateInputSourceList returned empty array");
            return;
        }

        let mut indices: Vec<usize> = Vec::new();
        for i in 0..array.len() {
            let Some(source) = array.get(i as isize) else {
                continue;
            };
            if is_selectable_menu_source(*source) {
                indices.push(i as usize);
            }
        }

        if indices.len() < 2 {
            log::warn!(
                "input source TIS: need ≥2 selectable sources, found {}",
                indices.len()
            );
            return;
        }

        let current = TISCopyCurrentKeyboardInputSource();
        let current_id = property_string(current, "TISInputSourceID");
        if !current.is_null() {
            CFRelease(current);
        }

        let mut position = 0usize;
        if let Some(id) = current_id {
            for (pos, &idx) in indices.iter().enumerate() {
                let Some(source) = array.get(idx as isize) else {
                    continue;
                };
                if property_string(*source, "TISInputSourceID") == Some(id.clone()) {
                    position = pos;
                    break;
                }
            }
        }

        let len_i = indices.len() as isize;
        let next_pos = (position as isize + step).rem_euclid(len_i) as usize;
        let target_idx = indices[next_pos];
        let Some(target) = array.get(target_idx as isize) else {
            log::warn!("input source TIS: target index out of range");
            return;
        };
        let target_id = property_string(*target, "TISInputSourceID").unwrap_or_default();
        CFRetain(*target);
        let status = TISSelectInputSource(*target);
        CFRelease(*target);
        if status != NO_ERR {
            log::warn!("TISSelectInputSource({target_id}) failed: {status}");
        } else {
            log::info!("TISSelectInputSource OK → {target_id}");
        }
    }
}

fn cycle_input_source(step: isize) {
    let next = step > 0;
    if trigger_input_menu_hotkey(next) {
        return;
    }
    log::info!("input source: falling back to TIS");
    select_relative_tis(step);
}

pub fn select_next_input_source() {
    cycle_input_source(1);
}

pub fn select_previous_input_source() {
    cycle_input_source(-1);
}
