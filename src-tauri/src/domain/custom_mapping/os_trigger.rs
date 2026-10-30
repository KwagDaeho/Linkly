use parking_lot::Mutex;
use std::collections::HashSet;
use std::sync::LazyLock;

use crate::domain::device::ButtonId;
use crate::domain::profile::Activator;

use super::chord::find_match_trigger;
use super::handler::{fire_custom_press, CustomMaps};
use super::state::{request_chord_reeval, uses_os_watch};
use crate::domain::engine::input::apply_binding_release;
use crate::domain::profile::Profile;

static OS_TRIGGER_QUEUE: LazyLock<Mutex<Vec<(Activator, bool)>>> =
    LazyLock::new(|| Mutex::new(Vec::new()));

/// Entry ids currently held via OS trigger (for tap-thread release swallow).
pub(crate) static ACTIVE_OS_ENTRIES: LazyLock<Mutex<HashSet<String>>> =
    LazyLock::new(|| Mutex::new(HashSet::new()));

pub fn offer_os_trigger(activator: &Activator, down: bool) -> bool {
    if !uses_os_watch() {
        return false;
    }
    let swallow = if down {
        find_match_trigger(activator).is_some()
    } else {
        ACTIVE_OS_ENTRIES.lock().iter().any(|entry_id| {
            super::state::entry_by_id(entry_id)
                .and_then(|e| e.activator.effective_trigger())
                .is_some_and(|t| t.same_as(activator))
        })
    };
    if swallow {
        OS_TRIGGER_QUEUE.lock().push((activator.clone(), down));
        request_chord_reeval();
    }
    swallow
}

fn inject_button_for_entry(entry_id: &str) -> ButtonId {
    super::state::entry_by_id(entry_id)
        .and_then(|e| match e.activator.effective_trigger() {
            Some(Activator::Huge { button }) => Some(button),
            _ => None,
        })
        .unwrap_or(ButtonId::Left)
}

pub fn process_os_trigger_queue(profile: &Profile, maps: &mut CustomMaps) {
    let events: Vec<_> = std::mem::take(&mut *OS_TRIGGER_QUEUE.lock());
    for (activator, down) in events {
        if down {
            let Some(entry) = find_match_trigger(&activator) else {
                continue;
            };
            if maps.active_os.contains_key(&entry.id) {
                continue;
            }
            fire_custom_press(
                entry.id.clone(),
                inject_button_for_entry(&entry.id),
                &entry.binding,
                profile,
                maps,
            );
            if let Some(stored) = entry.activator.effective_trigger() {
                maps.active_os.insert(entry.id.clone(), stored);
            }
            ACTIVE_OS_ENTRIES.lock().insert(entry.id);
        } else {
            let to_release: Vec<String> = maps
                .active_os
                .iter()
                .filter(|(_, t)| t.same_as(&activator))
                .map(|(id, _)| id.clone())
                .collect();
            for entry_id in to_release {
                maps.active_os.remove(&entry_id);
                ACTIVE_OS_ENTRIES.lock().remove(&entry_id);
                let inject_id = inject_button_for_entry(&entry_id);
                let input = super::state::entry_by_id(&entry_id)
                    .and_then(|e| e.activator.effective_trigger())
                    .unwrap_or(crate::domain::profile::Activator::Huge {
                        button: inject_id,
                    });
                apply_binding_release(
                    entry_id,
                    inject_id,
                    &input,
                    profile,
                    &mut maps.pending,
                    &mut maps.held,
                    &mut maps.scroll_repeats,
                    &mut maps.key_repeats,
                );
            }
        }
    }
}

pub fn clear_os_active(maps: &mut CustomMaps) {
    ACTIVE_OS_ENTRIES.lock().clear();
}
