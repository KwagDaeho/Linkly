use std::collections::HashSet;

use crate::domain::device::ButtonId;
use crate::domain::profile::{Activator, ComboActivator, CustomMappingEntry};
use crate::platform::inject;

use super::active_os_custom_entry_ids;
use crate::domain::chord_token::capture_token_for_mouse_button;

use super::state::{
    self, effective_combo_keys_for_match, effective_sorted_modifiers, is_modifier,
    normalize_combo_keys, normalize_combo_modifiers, request_chord_reeval, sorted_modifiers,
    ACTIVE_BUTTONS, SWALLOWED_OS_BUTTONS,
};

pub(crate) fn combo_matches(combo: &ComboActivator, mods: &[String], keys: &[String]) -> bool {
    normalize_combo_modifiers(&combo.modifiers) == *mods
        && normalize_combo_keys(&combo.keys) == *keys
}

/// Combo matched and `trigger` is the control that completed it (down edge or held HID).
pub(crate) fn find_match_trigger_at_edge(
    trigger: &Activator,
    trigger_down: bool,
) -> Option<CustomMappingEntry> {
    if !trigger_down {
        return None;
    }
    let mods = effective_sorted_modifiers();
    state::entries()
        .iter()
        .find(|e| {
            let keys = effective_combo_keys_for_match(&e.activator);
            e.activator.triggers_match(trigger) && combo_matches(&e.activator, &mods, &keys)
        })
        .cloned()
}

pub(crate) fn find_match_trigger(trigger: &Activator) -> Option<CustomMappingEntry> {
    find_match_trigger_at_edge(trigger, true)
}

pub(crate) fn find_match(id: ButtonId) -> Option<CustomMappingEntry> {
    if !state::button_state().is_down(id) {
        return None;
    }
    find_match_trigger_at_edge(&Activator::Huge { button: id }, true)
}

pub(crate) fn find_match_with_flags(id: ButtonId, _event_flags: u64) -> Option<CustomMappingEntry> {
    let mods = effective_sorted_modifiers();
    state::entries()
        .iter()
        .find(|e| {
            let keys = effective_combo_keys_for_match(&e.activator);
            e.activator.triggers_match(&Activator::Huge { button: id })
                && combo_matches(&e.activator, &mods, &keys)
        })
        .cloned()
}

pub fn is_reserved_huge(id: ButtonId) -> bool {
    if ACTIVE_BUTTONS.lock().contains(&id) {
        return true;
    }
    find_match(id).is_some()
}

pub(crate) fn release_active_chord() {
    let mut mods: HashSet<String> = state::modifiers_held().clone();
    mods.extend(state::live_modifiers());
    let keys: Vec<String> = state::keys_held().iter().cloned().collect();
    let mod_vec = sorted_modifiers(&mods);
    if mod_vec.is_empty() && keys.is_empty() {
        return;
    }
    inject::release_chord_hold(&mod_vec, &keys);
    state::modifiers_held().clear();
    state::keys_held().clear();
}

/// Map CG mouse edge → HUGE button (shared-pointer OS events).
pub fn button_edge_from_event(etype: u32, button_number: i64) -> Option<(ButtonId, bool)> {
    match etype {
        1 => Some((ButtonId::Left, true)),
        2 => Some((ButtonId::Left, false)),
        3 => Some((ButtonId::Right, true)),
        4 => Some((ButtonId::Right, false)),
        25 => match button_number {
            2 => Some((ButtonId::Middle, true)),
            3 => Some((ButtonId::Back, true)),
            4 => Some((ButtonId::Forward, true)),
            _ => None,
        },
        26 => match button_number {
            2 => Some((ButtonId::Middle, false)),
            3 => Some((ButtonId::Back, false)),
            4 => Some((ButtonId::Forward, false)),
            _ => None,
        },
        _ => None,
    }
}

pub fn note_os_button_swallowed(id: ButtonId) {
    SWALLOWED_OS_BUTTONS.lock().insert(id);
}

pub fn note_os_button_released(id: ButtonId) {
    SWALLOWED_OS_BUTTONS.lock().remove(&id);
}

/// Drop OS mouse events for an active or matching custom chord before the HID worker runs.
pub fn should_swallow_os_button(id: ButtonId, event_flags: u64, down: bool) -> bool {
    if !state::uses_os_watch() {
        return false;
    }
    if down {
        return find_match_with_flags(id, event_flags).is_some() || find_match(id).is_some();
    }
    SWALLOWED_OS_BUTTONS.lock().contains(&id) || ACTIVE_BUTTONS.lock().contains(&id)
}

/// Swallow combo keys/modifiers only while a matched mapping is actively held (after fire).
pub fn should_swallow_os_key(name: &str) -> bool {
    if !state::uses_os_watch() {
        return false;
    }
    state::entries().iter().any(|entry| {
        if !entry_chord_is_live(entry) {
            return false;
        }
        entry.activator.keys.iter().any(|k| k == name)
            || entry.activator.modifiers.iter().any(|m| m == name)
    })
}

fn entry_chord_is_live(entry: &CustomMappingEntry) -> bool {
    match entry.activator.effective_trigger() {
        Some(Activator::Huge { button }) => ACTIVE_BUTTONS.lock().contains(&button),
        Some(_) => active_os_custom_entry_ids().contains(&entry.id),
        None => false,
    }
}

pub fn note_os_down(activator: &Activator, is_repeat: bool) {
    if is_repeat || !state::uses_os_watch() {
        return;
    }
    match activator {
        Activator::Key { name } => {
            if is_modifier(name) {
                state::modifiers_held().insert(name.clone());
            } else {
                state::keys_held().insert(name.clone());
            }
        }
        Activator::Mouse { button } => {
            state::keys_held().insert(capture_token_for_mouse_button(button));
        }
        _ => {}
    }
    request_chord_reeval();
}

pub fn note_os_up(activator: &Activator, is_repeat: bool) {
    if is_repeat || !state::uses_os_watch() {
        return;
    }
    match activator {
        Activator::Key { name } => {
            if is_modifier(name) {
                state::modifiers_held().remove(name);
            } else {
                state::keys_held().remove(name);
            }
        }
        Activator::Mouse { button } => {
            state::keys_held().remove(&capture_token_for_mouse_button(button));
        }
        _ => {}
    }
    request_chord_reeval();
}
