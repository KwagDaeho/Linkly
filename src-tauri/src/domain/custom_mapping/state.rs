use std::collections::HashSet;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::LazyLock;

use parking_lot::Mutex;

use crate::domain::chord_token::{button_id_for_capture_token, is_hardware_capture_token};
use crate::domain::device::{ButtonId, ButtonState};
use crate::domain::device::DeviceIdentityKey;
use crate::domain::modifier::{self, LEGACY_MODIFIER_ORDER, SIDE_MODIFIER_ORDER};
use crate::domain::profile::{
    effective_custom_mappings, Activator, ComboActivator, CustomMappingEntry, Profile,
};

pub(crate) const MODIFIER_ORDER: [&str; 12] = [
    LEGACY_MODIFIER_ORDER[0],
    LEGACY_MODIFIER_ORDER[1],
    LEGACY_MODIFIER_ORDER[2],
    LEGACY_MODIFIER_ORDER[3],
    SIDE_MODIFIER_ORDER[0],
    SIDE_MODIFIER_ORDER[1],
    SIDE_MODIFIER_ORDER[2],
    SIDE_MODIFIER_ORDER[3],
    SIDE_MODIFIER_ORDER[4],
    SIDE_MODIFIER_ORDER[5],
    SIDE_MODIFIER_ORDER[6],
    SIDE_MODIFIER_ORDER[7],
];

pub(crate) const FLAG_CONTROL: u64 = 0x0004_0000;
pub(crate) const FLAG_OPTION: u64 = 0x0008_0000;
pub(crate) const FLAG_SHIFT: u64 = 0x0002_0000;
pub(crate) const FLAG_COMMAND: u64 = 0x0010_0000;

#[link(name = "CoreGraphics", kind = "framework")]
extern "C" {
    fn CGEventSourceFlagsState(state_id: u32) -> u64;
}

static ENTRIES: Mutex<Vec<CustomMappingEntry>> = Mutex::new(Vec::new());
static MODIFIERS_HELD: LazyLock<Mutex<HashSet<String>>> =
    LazyLock::new(|| Mutex::new(HashSet::new()));
static KEYS_HELD: LazyLock<Mutex<HashSet<String>>> =
    LazyLock::new(|| Mutex::new(HashSet::new()));
pub(crate) static ACTIVE_BUTTONS: LazyLock<Mutex<HashSet<ButtonId>>> =
    LazyLock::new(|| Mutex::new(HashSet::new()));
static BUTTON_STATE: LazyLock<Mutex<ButtonState>> =
    LazyLock::new(|| Mutex::new(ButtonState::default()));
pub(crate) static CHORD_REEVAL: AtomicBool = AtomicBool::new(false);
pub(crate) static SWALLOWED_OS_BUTTONS: LazyLock<Mutex<HashSet<ButtonId>>> =
    LazyLock::new(|| Mutex::new(HashSet::new()));

pub(crate) fn entries() -> parking_lot::MutexGuard<'static, Vec<CustomMappingEntry>> {
    ENTRIES.lock()
}

pub(crate) fn modifiers_held() -> parking_lot::MutexGuard<'static, HashSet<String>> {
    MODIFIERS_HELD.lock()
}

pub(crate) fn keys_held() -> parking_lot::MutexGuard<'static, HashSet<String>> {
    KEYS_HELD.lock()
}

pub(crate) fn button_state() -> parking_lot::MutexGuard<'static, ButtonState> {
    BUTTON_STATE.lock()
}

pub(crate) fn live_modifiers() -> HashSet<String> {
    let flags = unsafe { CGEventSourceFlagsState(0) };
    let mut mods = HashSet::new();
    if flags & FLAG_CONTROL != 0 {
        mods.insert("Control".into());
    }
    if flags & FLAG_OPTION != 0 {
        mods.insert("Option".into());
    }
    if flags & FLAG_SHIFT != 0 {
        mods.insert("Shift".into());
    }
    if flags & FLAG_COMMAND != 0 {
        mods.insert("Meta".into());
    }
    mods
}

pub fn sync_from_profile(profile: &Profile, trigger_device: Option<DeviceIdentityKey>) {
    let next = if profile.enabled {
        effective_custom_mappings(profile, trigger_device)
            .into_iter()
            .filter(|e| e.activator.is_valid())
            .collect()
    } else {
        Vec::new()
    };
    *ENTRIES.lock() = next;
    if !uses_os_watch() {
        MODIFIERS_HELD.lock().clear();
        KEYS_HELD.lock().clear();
    }
}

pub fn sync_button_state(state: ButtonState) {
    *BUTTON_STATE.lock() = state;
}

pub fn uses_os_watch() -> bool {
    ENTRIES.lock().iter().any(|e| {
        !e.activator.modifiers.is_empty() || !e.activator.keys.is_empty()
    })
}

pub(crate) fn entry_by_id(id: &str) -> Option<CustomMappingEntry> {
    ENTRIES.lock().iter().find(|e| e.id == id).cloned()
}

pub(crate) fn request_chord_reeval() {
    CHORD_REEVAL.store(true, Ordering::SeqCst);
}

pub(crate) fn effective_modifiers() -> HashSet<String> {
    let mut merged = MODIFIERS_HELD.lock().clone();
    merged.extend(live_modifiers());
    merged
}

pub(crate) fn effective_keys() -> HashSet<String> {
    KEYS_HELD.lock().clone()
}

pub(crate) fn modifiers_from_flags(flags: u64) -> HashSet<String> {
    let mut mods = HashSet::new();
    if flags & FLAG_CONTROL != 0 {
        mods.insert("Control".into());
    }
    if flags & FLAG_OPTION != 0 {
        mods.insert("Option".into());
    }
    if flags & FLAG_SHIFT != 0 {
        mods.insert("Shift".into());
    }
    if flags & FLAG_COMMAND != 0 {
        mods.insert("Meta".into());
    }
    mods
}

pub(crate) fn sorted_modifiers(set: &HashSet<String>) -> Vec<String> {
    MODIFIER_ORDER
        .iter()
        .filter(|m| set.contains(**m))
        .map(|s| (*s).to_string())
        .collect()
}

pub(crate) fn sorted_keys(set: &HashSet<String>) -> Vec<String> {
    let mut keys: Vec<String> = set.iter().cloned().collect();
    keys.sort();
    keys
}

pub(crate) fn effective_sorted_modifiers() -> Vec<String> {
    sorted_modifiers(&effective_modifiers())
}

pub(crate) fn effective_sorted_keys() -> Vec<String> {
    sorted_keys(&effective_keys())
}

/// Held keys for one combo entry — matches FE `snapshotToComboActivator` (trigger key excluded).
pub(crate) fn effective_combo_keys_for_match(combo: &ComboActivator) -> Vec<String> {
    let buttons = button_state();
    let mut keyboard = keys_held().clone();
    if let Some(Activator::Key { name }) = combo.effective_trigger() {
        keyboard.remove(&name);
    }
    let mut matched = HashSet::new();
    for token in &combo.keys {
        if is_hardware_capture_token(token) {
            if let Some(id) = button_id_for_capture_token(token) {
                if buttons.is_down(id) {
                    matched.insert(token.clone());
                }
            } else if keyboard.contains(token) {
                matched.insert(token.clone());
            }
        } else if keyboard.contains(token) {
            matched.insert(token.clone());
        }
    }
    sorted_keys(&matched)
}

pub(crate) fn normalize_combo_modifiers(v: &[String]) -> Vec<String> {
    MODIFIER_ORDER
        .iter()
        .filter(|m| v.iter().any(|x| x == *m))
        .map(|s| (*s).to_string())
        .collect()
}

pub(crate) fn normalize_combo_keys(v: &[String]) -> Vec<String> {
    let mut keys = v.to_vec();
    keys.sort();
    keys
}

pub(crate) fn is_modifier(name: &str) -> bool {
    modifier::is_modifier_name(name)
}

pub(crate) fn sync_active_buttons(active: &std::collections::HashMap<ButtonId, String>) {
    let mut buttons = ACTIVE_BUTTONS.lock();
    buttons.clear();
    buttons.extend(active.keys().copied());
}
