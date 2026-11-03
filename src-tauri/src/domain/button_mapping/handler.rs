use std::collections::{HashMap, HashSet};
use std::time::Duration;

use crate::domain::device::{ButtonId, ButtonState};
use crate::domain::engine::input::{
    apply_binding_press, apply_binding_release, fire_due_key_repeats_for,
    fire_due_long_presses_for, take_due_scroll_repeats_for, ActionRepeat, PendingHold,
    ScrollRepeat,
};
use crate::domain::profile::{Action, Activator, ButtonBinding, Profile};
use crate::domain::remap;
use crate::domain::link_event::{self, LinkPhase};

use super::state::{self, entry_by_id, find_mapping_for_button, inject_button_for_entry};

pub struct ButtonMaps {
    pub pending: HashMap<String, PendingHold>,
    pub held: HashMap<String, Action>,
    pub scroll_repeats: HashMap<String, ScrollRepeat>,
    pub key_repeats: HashMap<String, ActionRepeat>,
    pub active_os: HashMap<String, crate::domain::profile::Activator>,
    /// catalog button currently driving a button-mapping row (HID path).
    pub active_catalog_buttons: HashMap<ButtonId, String>,
}

impl Default for ButtonMaps {
    fn default() -> Self {
        Self {
            pending: HashMap::new(),
            held: HashMap::new(),
            scroll_repeats: HashMap::new(),
            key_repeats: HashMap::new(),
            active_os: HashMap::new(),
            active_catalog_buttons: HashMap::new(),
        }
    }
}

impl ButtonMaps {
    pub fn clear(&mut self) {
        self.pending.clear();
        self.held.clear();
        self.scroll_repeats.clear();
        self.key_repeats.clear();
        self.active_os.clear();
        self.active_catalog_buttons.clear();
        super::os_trigger::clear_os_active(self);
    }
}

/// Button-mapping rows keyed by `Activator::Device` — OS trigger queue does not see these.
pub fn handle_catalog_button_transitions(
    prev: ButtonState,
    state: ButtonState,
    profile: &Profile,
    maps: &mut ButtonMaps,
    skip_press: &HashSet<ButtonId>,
    skip_release: &HashSet<ButtonId>,
) -> (HashSet<ButtonId>, HashSet<ButtonId>) {
    let mut out_skip_press = HashSet::new();
    let mut out_skip_release = HashSet::new();

    for id in state.released_edges(prev) {
        if skip_release.contains(&id) {
            continue;
        }
        let Some(entry_id) = maps.active_catalog_buttons.remove(&id) else {
            continue;
        };
        state::set_catalog_button_held(id, false);
        out_skip_release.insert(id);
        let inject_id = state::entry_by_id(&entry_id)
            .map(|e| inject_button_for_entry(&e))
            .unwrap_or(id);
        let input = state::entry_by_id(&entry_id)
            .and_then(|e| e.activator.clone())
            .unwrap_or(Activator::Device { button: id });
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

    for id in state.pressed_edges(prev) {
        if skip_press.contains(&id) {
            if find_mapping_for_button(id).is_some_and(|e| state::entry_needs_app_handling(&e)) {
                out_skip_press.insert(id);
            }
            continue;
        }
        if maps.active_catalog_buttons.contains_key(&id) {
            out_skip_press.insert(id);
            continue;
        }
        let Some(entry) = find_mapping_for_button(id) else {
            continue;
        };
        if !state::entry_needs_app_handling(&entry) {
            continue;
        }
        out_skip_press.insert(id);
        maps.active_catalog_buttons.insert(id, entry.id.clone());
        state::set_catalog_button_held(id, true);
        let inject_id = inject_button_for_entry(&entry);
        fire_button_press(
            entry.id.clone(),
            inject_id,
            &entry.binding,
            profile,
            maps,
        );
    }

    (out_skip_release, out_skip_press)
}

pub(crate) fn fire_button_press(
    entry_id: String,
    inject_id: ButtonId,
    binding: &ButtonBinding,
    profile: &Profile,
    maps: &mut ButtonMaps,
) {
    let input = entry_by_id(&entry_id)
        .and_then(|e| e.activator.clone())
        .unwrap_or(Activator::Device { button: inject_id });
    apply_binding_press(
        entry_id,
        inject_id,
        &input,
        binding,
        profile,
        &mut maps.pending,
        &mut maps.held,
        &mut maps.scroll_repeats,
        &mut maps.key_repeats,
        true,
    );
}

/// Drop in-flight presses when the profile no longer matches (e.g. row removed while L held).
pub fn reset_pressed_state(maps: &mut ButtonMaps, profile: &Profile) {
    let _ = profile;
    for (entry_id, action) in maps.held.drain() {
        let inject_id = state::entry_by_id(&entry_id)
            .map(|e| inject_button_for_entry(&e))
            .unwrap_or(ButtonId::Left);
        crate::platform::inject::release_action(inject_id, &action);
    }
    for (entry_id, hold) in maps.pending.drain() {
        if hold.long_fired {
            if let Some(action) = maps.held.remove(&entry_id) {
                let inject_id = state::entry_by_id(&entry_id)
                    .map(|e| inject_button_for_entry(&e))
                    .unwrap_or(ButtonId::Left);
                crate::platform::inject::release_action(inject_id, &action);
            }
        }
    }
    maps.scroll_repeats.clear();
    maps.key_repeats.clear();
    maps.active_catalog_buttons.clear();
    state::clear_catalog_buttons_held();
    super::os_trigger::clear_os_active(maps);
    if crate::platform::inject::synthetic_buttons_held() {
        use crate::domain::profile::MouseClickButton;
        for button in [
            MouseClickButton::Left,
            MouseClickButton::Right,
            MouseClickButton::Middle,
            MouseClickButton::Back,
            MouseClickButton::Forward,
        ] {
            crate::platform::inject::mouse_up(&button);
        }
    }
}

pub fn fire_due_ticks(maps: &mut ButtonMaps, profile: &Profile, threshold: Duration) {
    super::reserve::reconcile_active_os(maps);
    fire_due_long_presses_for(
        &mut maps.pending,
        &mut maps.held,
        &profile.pointer,
        threshold,
        |entry_id| {
            entry_by_id(entry_id)
                .map(|e| inject_button_for_entry(&e))
                .unwrap_or(ButtonId::Left)
        },
        |entry_id, action| {
            if let Some(entry) = entry_by_id(entry_id) {
                if let Some(ref activator) = entry.activator {
                    let inject_id = inject_button_for_entry(&entry);
                    link_event::announce(activator, action, inject_id, LinkPhase::LongPress);
                }
            }
        },
    );
    let (dx, dy) = take_due_scroll_repeats_for(&mut maps.scroll_repeats);
    if dx != 0 || dy != 0 {
        crate::platform::inject::scroll_by_units_ex(dx, dy, &profile.pointer, true);
    }
    fire_due_key_repeats_for(
        &mut maps.key_repeats,
        &profile.pointer,
        |entry_id| {
            entry_by_id(entry_id)
                .map(|e| inject_button_for_entry(&e))
                .unwrap_or(ButtonId::Left)
        },
    );
}

pub fn pointer_takeover_active(maps: &ButtonMaps, profile: &Profile) -> bool {
    for (entry_id, action) in &maps.held {
        let Some(entry) = entry_by_id(entry_id) else {
            continue;
        };
        let id = inject_button_for_entry(&entry);
        if action_needs_pointer_takeover(id, action) {
            return true;
        }
    }
    for (entry_id, hold) in &maps.pending {
        let Some(entry) = entry_by_id(entry_id) else {
            continue;
        };
        let id = inject_button_for_entry(&entry);
        if hold.long_fired && action_needs_pointer_takeover(id, &hold.long_press) {
            return true;
        }
        if !hold.long_fired
            && !entry.binding.waits_for_long_press()
            && action_needs_pointer_takeover(id, &hold.click)
        {
            return true;
        }
    }
    let _ = profile;
    false
}

fn action_needs_pointer_takeover(id: ButtonId, action: &Action) -> bool {
    if matches!(
        id,
        ButtonId::Left | ButtonId::Right | ButtonId::Middle | ButtonId::Back | ButtonId::Forward
    ) {
        return !remap::action_is_native_for(id, action);
    }
    matches!(
        action,
        Action::MouseClick { .. } | Action::DoubleClick | Action::Scroll { .. }
    )
}
