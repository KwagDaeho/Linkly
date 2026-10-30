use crate::domain::device::ButtonId;

use super::handler::ButtonMaps;
use super::os_trigger::ACTIVE_OS_ENTRIES;
use super::state::{self, find_huge};

/// Block parallel HID edges when this HUGE button is remapped / not OS-passthrough.
pub fn is_reserved_huge(id: ButtonId) -> bool {
    find_huge(id).is_some_and(|e| state::entry_needs_app_handling(&e))
}

pub(crate) fn reconcile_active_os(maps: &mut ButtonMaps) {
    maps.active_os.retain(|entry_id, _| {
        maps.pending.contains_key(entry_id) || maps.held.contains_key(entry_id)
    });
    let live: std::collections::HashSet<String> = maps.active_os.keys().cloned().collect();
    ACTIVE_OS_ENTRIES.lock().retain(|id| live.contains(id));
    if maps.active_os.is_empty() && maps.pending.is_empty() && maps.held.is_empty() {
        ACTIVE_OS_ENTRIES.lock().clear();
    }
}
