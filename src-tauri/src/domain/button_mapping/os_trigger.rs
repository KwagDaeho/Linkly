use parking_lot::Mutex;
use std::collections::HashSet;
use std::sync::LazyLock;

use crate::domain::engine::input::apply_binding_release;
use crate::domain::profile::{Activator, Profile};

use super::handler::{fire_button_press, ButtonMaps};
use super::state::{self, find_trigger};

static OS_TRIGGER_QUEUE: LazyLock<Mutex<Vec<(Activator, bool)>>> =
    LazyLock::new(|| Mutex::new(Vec::new()));

pub(crate) static ACTIVE_OS_ENTRIES: LazyLock<Mutex<HashSet<String>>> =
    LazyLock::new(|| Mutex::new(HashSet::new()));

pub fn offer_os_trigger(activator: &Activator, down: bool) -> bool {
    if !state::uses_os_watch() {
        return false;
    }
    let swallow = if down {
        find_trigger(activator).is_some()
    } else {
        ACTIVE_OS_ENTRIES.lock().iter().any(|entry_id| {
            state::entry_by_id(entry_id)
                .and_then(|e| e.activator)
                .is_some_and(|t| t.same_as(activator))
        })
    };
    if swallow {
        OS_TRIGGER_QUEUE.lock().push((activator.clone(), down));
    }
    swallow
}

pub fn process_os_trigger_queue(profile: &Profile, maps: &mut ButtonMaps) {
    let events: Vec<_> = std::mem::take(&mut *OS_TRIGGER_QUEUE.lock());
    for (activator, down) in events {
        if down {
            let Some(entry) = find_trigger(&activator) else {
                continue;
            };
            if maps.active_os.contains_key(&entry.id) {
                continue;
            }
            let inject_id = state::inject_button_for_entry(&entry);
            fire_button_press(
                entry.id.clone(),
                inject_id,
                &entry.binding,
                profile,
                maps,
            );
            if let Some(stored) = entry.activator.clone() {
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
                let inject_id = state::entry_by_id(&entry_id)
                    .map(|e| state::inject_button_for_entry(&e))
                    .unwrap_or(crate::domain::device::ButtonId::Left);
                let input = state::entry_by_id(&entry_id)
                    .and_then(|e| e.activator.clone())
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

pub fn clear_os_active(maps: &mut ButtonMaps) {
    ACTIVE_OS_ENTRIES.lock().clear();
    maps.active_os.clear();
}
