//! Single-activator input → binding rows.

mod handler;
mod os_trigger;
mod reserve;
mod state;

pub use handler::{
    fire_due_ticks, handle_catalog_button_transitions, pointer_takeover_active, reset_pressed_state,
    ButtonMaps,
};
pub use os_trigger::{offer_os_trigger, process_os_trigger_queue};
pub use reserve::is_reserved_catalog_button;
pub use state::{find_mapping_for_button, sync_from_profile, uses_os_watch};
