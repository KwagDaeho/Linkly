use parking_lot::Mutex;
use std::sync::LazyLock;

use crate::domain::device::ButtonId;
use crate::domain::device::DeviceIdentityKey;
use crate::domain::profile::{
    activator_options_same, effective_button_mappings, Activator, ButtonMappingEntry,
    MouseClickButton, Profile,
};
use crate::domain::remap;

static ENTRIES: LazyLock<Mutex<Vec<ButtonMappingEntry>>> =
    LazyLock::new(|| Mutex::new(Vec::new()));

fn entries_changed(prev: &[ButtonMappingEntry], next: &[ButtonMappingEntry]) -> bool {
    if prev.len() != next.len() {
        return true;
    }
    prev.iter().zip(next.iter()).any(|(a, b)| {
        a.id != b.id
            || !activator_options_same(&a.activator, &b.activator)
            || a.binding.long_press_enabled != b.binding.long_press_enabled
            || a.binding.auto_click != b.binding.auto_click
            || format!("{:?}", a.binding.click) != format!("{:?}", b.binding.click)
            || format!("{:?}", a.binding.long_press) != format!("{:?}", b.binding.long_press)
    })
}

pub fn sync_from_profile(
    profile: &Profile,
    trigger_device: Option<DeviceIdentityKey>,
) -> bool {
    let next = if profile.enabled {
        effective_button_mappings(profile, trigger_device)
            .into_iter()
            .filter(|entry| entry.is_valid())
            .collect()
    } else {
        Vec::new()
    };
    let mut guard = ENTRIES.lock();
    let changed = entries_changed(&guard, &next);
    *guard = next;
    changed
}

pub fn uses_os_watch() -> bool {
    ENTRIES.lock().iter().any(|entry| {
        matches!(
            entry.activator,
            Some(Activator::Key { .. } | Activator::Mouse { .. })
        )
    })
}

pub fn entries() -> parking_lot::MutexGuard<'static, Vec<ButtonMappingEntry>> {
    ENTRIES.lock()
}

pub fn entry_by_id(id: &str) -> Option<ButtonMappingEntry> {
    ENTRIES.lock().iter().find(|e| e.id == id).cloned()
}

pub fn hid_button_for_activator(activator: &Activator) -> Option<ButtonId> {
    match activator {
        Activator::Device { button } => Some(*button),
        Activator::Mouse { button } => hid_button_for_mouse(button),
        Activator::Key { .. } => None,
    }
}

pub fn hid_button_for_mouse(button: &MouseClickButton) -> Option<ButtonId> {
    match button {
        MouseClickButton::Left => Some(ButtonId::Left),
        MouseClickButton::Right => Some(ButtonId::Right),
        MouseClickButton::Middle => Some(ButtonId::Middle),
        MouseClickButton::Back => Some(ButtonId::Back),
        MouseClickButton::Forward => Some(ButtonId::Forward),
        MouseClickButton::Other { .. } => None,
    }
}

pub fn find_mapping_for_button(id: ButtonId) -> Option<ButtonMappingEntry> {
    ENTRIES
        .lock()
        .iter()
        .find(|entry| {
            matches!(
                entry.activator,
                Some(Activator::Device { button }) if button == id
            )
        })
        .cloned()
}

pub fn find_trigger(trigger: &Activator) -> Option<ButtonMappingEntry> {
    ENTRIES
        .lock()
        .iter()
        .find(|entry| {
            entry
                .activator
                .as_ref()
                .is_some_and(|stored| stored.same_as(trigger))
        })
        .cloned()
}

/// True when this row must swallow OS clicks / drive HID (not plain OS passthrough).
pub fn entry_needs_app_handling(entry: &ButtonMappingEntry) -> bool {
    let inject_id = inject_button_for_entry(entry);
    if entry.binding.waits_for_long_press() || entry.binding.uses_auto_click() {
        return true;
    }
    !remap::action_is_native_for(inject_id, &entry.binding.click)
}

pub fn inject_button_for_entry(entry: &ButtonMappingEntry) -> ButtonId {
    match &entry.activator {
        Some(activator) => hid_button_for_activator(activator).unwrap_or(ButtonId::Left),
        None => ButtonId::Left,
    }
}
