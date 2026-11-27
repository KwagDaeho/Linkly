use crate::domain::ball_scroll;
use crate::domain::button_mapping;
use crate::domain::custom_mapping;
use crate::domain::profile::Profile;

pub fn needs_os_event_watch(profile: &Profile) -> bool {
    ball_scroll::needs_event_watch(profile)
        || crate::domain::gesture::needs_event_watch(profile)
        || custom_mapping::uses_os_watch()
        || button_mapping::uses_os_watch()
        // The tap merges modifiers held on one keyboard into keys typed on another.
        || crate::platform::keyboards::merge_needed()
}
