use crate::app::state::AppState;
use crate::domain::ball_scroll;
use crate::domain::button_mapping;
use crate::domain::custom_mapping;
use crate::domain::watch;
use crate::domain::profile::Profile;
use crate::persistence::profile_store;
use tauri::State;

#[tauri::command]
pub fn get_profile(state: State<'_, AppState>) -> Profile {
    state.engine.profile()
}

#[tauri::command]
pub fn save_profile(state: State<'_, AppState>, profile: Profile) -> Result<(), String> {
    profile_store::save_profile(&profile)?;
    state.engine.set_profile(profile.clone());
    ball_scroll::sync_from_profile(&profile);
    crate::domain::gesture::sync_from_profile(&profile);
    custom_mapping::sync_from_profile(&profile, None);
    button_mapping::sync_from_profile(&profile, None);
    if watch::needs_os_event_watch(&profile) {
        crate::platform::capture::ensure_watch_tap();
    }
    Ok(())
}

/// Gesture draw dialog open/closed (the gesture keys record instead of firing).
#[tauri::command]
pub fn set_gesture_recording(active: bool) {
    crate::domain::gesture::set_recording(active);
}
