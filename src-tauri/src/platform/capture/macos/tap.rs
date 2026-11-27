use std::ffi::c_void;

use crate::domain::ball_scroll;
use crate::domain::custom_mapping;
use crate::domain::gesture;
use crate::domain::profile::Activator;
use crate::platform::app_bus;
use crate::platform::inject;

use super::combo::{emit_combo_preview, note_capture_token, note_key_down, note_key_up, note_modifier_flags_changed};
use super::super::token::activator_capture_token;
use super::keycodes::{
    chord_from_event, key_activator, modifier_down, CGEventRef, CGEventTapProxy,
    CGEventGetIntegerValueField, FLAG_COMMAND, KEYBOARD_EVENT_AUTOREPEAT,
    KEYBOARD_EVENT_KEYCODE, KEY_DOWN, KEY_UP, FLAGS_CHANGED, MOUSE_EVENT_BUTTON_NUMBER,
};
use super::super::emit::{
    emit_activator, emit_activator_choice, emit_capture_left_pointer, emit_chord,
};
use super::super::session;
use super::super::types::{ActivatorCapture, ComboTriggerCapture};

pub(crate) unsafe extern "C" fn tap_callback(
    _proxy: CGEventTapProxy,
    etype: u32,
    event: CGEventRef,
    _user: *mut c_void,
) -> CGEventRef {
    let _pool = crate::platform::autorelease::Pool::new();
    if etype == 0xFFFF_FFFE || etype == 0xFFFF_FFFF {
        super::reenable_key_capture_tap();
        return event;
    }

    merge_held_modifiers(etype, event);

    if crate::platform::input_monitor::enabled() {
        super::viewer::emit_viewer_event(etype, event);
    }

    if session::capture_active() {
        let combo = session::combo_trigger_capture();
        // A proxy key standing for a mouse button is captured as that button —
        // in combo, activator and key-chord capture alike (never as e.g. "F20").
        if etype == KEY_DOWN || etype == KEY_UP {
            if let Some(alias) = key_activator(event).and_then(|a| proxy_alias(&a)) {
                let down = etype == KEY_DOWN;
                let autorepeat =
                    unsafe { CGEventGetIntegerValueField(event, KEYBOARD_EVENT_AUTOREPEAT) } != 0;
                if combo {
                    if let Some(token) = activator_capture_token(&alias) {
                        note_capture_token(&token, down);
                        emit_combo_preview();
                    }
                    return std::ptr::null_mut();
                }
                if session::activator_capture() {
                    if down && !autorepeat {
                        emit_activator_choice(alias);
                    }
                    return std::ptr::null_mut();
                }
            }
        }
        if etype == KEY_UP {
            if combo {
                note_modifier_flags_changed(event);
                let code =
                    unsafe { CGEventGetIntegerValueField(event, KEYBOARD_EVENT_KEYCODE) } as u16;
                note_key_up(code);
                emit_combo_preview();
            }
            return std::ptr::null_mut();
        }
        if etype == FLAGS_CHANGED {
            note_modifier_flags_changed(event);
            emit_combo_preview();
            return std::ptr::null_mut();
        }
        if etype == KEY_DOWN {
            let autorepeat =
                unsafe { CGEventGetIntegerValueField(event, KEYBOARD_EVENT_AUTOREPEAT) } != 0;
            if !autorepeat {
                if let Some(chord) = chord_from_event(event) {
                    if chord.escape {
                        if combo {
                            app_bus::emit(
                                "combo-trigger-capture",
                                ComboTriggerCapture {
                                    escape: true,
                                    rejected: None,
                                    combo: None,
                                },
                            );
                        } else {
                            emit_chord(chord);
                        }
                        return std::ptr::null_mut();
                    }
                    if combo {
                        note_modifier_flags_changed(event);
                        note_key_down(event);
                        emit_combo_preview();
                    } else {
                        emit_chord(chord);
                    }
                } else if combo {
                    note_modifier_flags_changed(event);
                    emit_combo_preview();
                }
            }
            return std::ptr::null_mut();
        }
        if session::activator_capture() && !session::combo_trigger_capture() {
            return handle_activator_capture(etype, event);
        }
        if session::combo_trigger_capture() {
            if let Some((activator, down)) = ball_scroll::mouse_from_event(
                etype,
                unsafe { CGEventGetIntegerValueField(event, MOUSE_EVENT_BUTTON_NUMBER) },
            ) {
                if down && activator.is_left_click() {
                    emit_capture_left_pointer();
                } else if let Some(token) = activator_capture_token(&activator) {
                    note_capture_token(&token, down);
                    emit_combo_preview();
                }
                return std::ptr::null_mut();
            }
        }
        return event;
    }

    if session::activator_capture() && !session::combo_trigger_capture() {
        return handle_activator_capture(etype, event);
    }

    handle_watch(etype, event)
}

fn handle_activator_capture(etype: u32, event: CGEventRef) -> CGEventRef {
    if etype == KEY_DOWN {
        let autorepeat =
            unsafe { CGEventGetIntegerValueField(event, KEYBOARD_EVENT_AUTOREPEAT) } != 0;
        if autorepeat {
            return std::ptr::null_mut();
        }
        if let Some(activator) = key_activator(event) {
            if matches!(&activator, Activator::Key { name } if name == "Escape") {
                emit_activator(ActivatorCapture {
                    escape: true,
                    rejected: None,
                    activator: None,
                });
            } else {
                emit_activator_choice(proxy_alias(&activator).unwrap_or(activator));
            }
        }
        return std::ptr::null_mut();
    }
    if etype == KEY_UP {
        return std::ptr::null_mut();
    }
    if etype == FLAGS_CHANGED {
        if let Some((activator, down)) = modifier_down(event) {
            if down {
                emit_activator_choice(activator);
            }
        }
        return std::ptr::null_mut();
    }
    if let Some((activator, down)) = ball_scroll::mouse_from_event(
        etype,
        unsafe { CGEventGetIntegerValueField(event, MOUSE_EVENT_BUTTON_NUMBER) },
    ) {
        if activator.is_left_click() {
            if down {
                if session::allow_left_activator() {
                    emit_capture_left_pointer();
                } else {
                    emit_activator_choice(activator);
                }
            }
            return std::ptr::null_mut();
        }
        if down {
            emit_activator_choice(activator);
        }
        return std::ptr::null_mut();
    }
    event
}

fn handle_watch(etype: u32, event: CGEventRef) -> CGEventRef {
    if let Some((button_id, down)) = custom_mapping::button_edge_from_event(
        etype,
        unsafe { CGEventGetIntegerValueField(event, MOUSE_EVENT_BUTTON_NUMBER) },
    ) {
        let flags = unsafe { super::keycodes::CGEventGetFlags(event) };
        if custom_mapping::should_swallow_os_button(button_id, flags, down) {
            if down {
                custom_mapping::note_os_button_swallowed(button_id);
            } else {
                custom_mapping::note_os_button_released(button_id);
            }
            return std::ptr::null_mut();
        }
    }
    if etype == KEY_DOWN {
        let autorepeat =
            unsafe { CGEventGetIntegerValueField(event, KEYBOARD_EVENT_AUTOREPEAT) } != 0;
        if let Some(activator) = key_activator(event) {
            if !autorepeat {
                let flags = unsafe { super::keycodes::CGEventGetFlags(event) };
                // This tap is system-wide: ⌘Q quits Linkly only when Linkly is the
                // active app, not when the user quits some other app.
                if matches!(&activator, Activator::Key { name } if name == "Q")
                    && flags & FLAG_COMMAND != 0
                    && app_bus::own_app_is_active()
                {
                    ball_scroll::arm_app_quit();
                }
                ball_scroll::yield_modifier_hold_for_chord(&activator);
                if matches!(&activator, Activator::Key { name } if name == "Escape")
                    && gesture::on_escape()
                {
                    return std::ptr::null_mut();
                }
            }
            // A proxy key standing for a mouse button acts as that button first;
            // unclaimed, its own row injects the button.
            if let Some(alias) = proxy_alias(&activator) {
                custom_mapping::note_os_down(&alias, autorepeat);
                if gesture::on_os_down(&alias, autorepeat)
                    || ball_scroll::on_os_down(&alias, autorepeat)
                    || custom_mapping::offer_os_trigger(&alias, true)
                    || crate::domain::button_mapping::offer_os_trigger(&alias, true)
                {
                    return std::ptr::null_mut();
                }
            }
            custom_mapping::note_os_down(&activator, autorepeat);
            if gesture::on_os_down(&activator, autorepeat)
                || ball_scroll::on_os_down(&activator, autorepeat)
            {
                return std::ptr::null_mut();
            }
            if custom_mapping::offer_os_trigger(&activator, true)
                || crate::domain::button_mapping::offer_os_trigger(&activator, true)
            {
                return std::ptr::null_mut();
            }
            if let Activator::Key { name } = &activator {
                if inject::should_block_chord_modifier(name) {
                    return std::ptr::null_mut();
                }
                if custom_mapping::should_swallow_os_key(name) {
                    return std::ptr::null_mut();
                }
            }
        }
        return event;
    }
    if etype == KEY_UP {
        let autorepeat =
            unsafe { CGEventGetIntegerValueField(event, KEYBOARD_EVENT_AUTOREPEAT) } != 0;
        if let Some(activator) = key_activator(event) {
            if let Some(alias) = proxy_alias(&activator) {
                custom_mapping::note_os_up(&alias, autorepeat);
                if gesture::on_os_up(&alias, autorepeat)
                    || ball_scroll::on_os_up(&alias, autorepeat)
                    || custom_mapping::offer_os_trigger(&alias, false)
                    || crate::domain::button_mapping::offer_os_trigger(&alias, false)
                {
                    return std::ptr::null_mut();
                }
            }
            custom_mapping::note_os_up(&activator, autorepeat);
            if gesture::on_os_up(&activator, autorepeat)
                || ball_scroll::on_os_up(&activator, autorepeat)
            {
                return std::ptr::null_mut();
            }
            if custom_mapping::offer_os_trigger(&activator, false)
                || crate::domain::button_mapping::offer_os_trigger(&activator, false)
            {
                return std::ptr::null_mut();
            }
            if let Activator::Key { name } = &activator {
                if inject::should_block_chord_modifier(name) {
                    return std::ptr::null_mut();
                }
                if custom_mapping::should_swallow_os_key(name) {
                    return std::ptr::null_mut();
                }
            }
        }
        return event;
    }
    if etype == FLAGS_CHANGED {
        if let Some((activator, down)) = modifier_down(event) {
            if let Activator::Key { name } = &activator {
                if inject::should_block_chord_modifier(name) {
                    return std::ptr::null_mut();
                }
            }
            if down {
                custom_mapping::note_os_down(&activator, false);
                if gesture::on_os_down(&activator, false)
                    || ball_scroll::on_os_down(&activator, false)
                {
                    return std::ptr::null_mut();
                }
                if custom_mapping::offer_os_trigger(&activator, true)
                    || crate::domain::button_mapping::offer_os_trigger(&activator, true)
                {
                    return std::ptr::null_mut();
                }
            } else {
                custom_mapping::note_os_up(&activator, false);
                if gesture::on_os_up(&activator, false)
                    || ball_scroll::on_os_up(&activator, false)
                {
                    return std::ptr::null_mut();
                }
                if custom_mapping::offer_os_trigger(&activator, false)
                    || crate::domain::button_mapping::offer_os_trigger(&activator, false)
                {
                    return std::ptr::null_mut();
                }
            }
        }
        return event;
    }
    if let Some((activator, down)) = ball_scroll::mouse_from_event(
        etype,
        unsafe { CGEventGetIntegerValueField(event, MOUSE_EVENT_BUTTON_NUMBER) },
    ) {
        let handled = if down {
            gesture::on_os_down(&activator, false) || ball_scroll::on_os_down(&activator, false)
        } else {
            gesture::on_os_up(&activator, false) || ball_scroll::on_os_up(&activator, false)
        };
        if handled {
            return std::ptr::null_mut();
        }
        if custom_mapping::offer_os_trigger(&activator, down)
            || crate::domain::button_mapping::offer_os_trigger(&activator, down)
        {
            return std::ptr::null_mut();
        }
    }
    event
}

/// macOS keeps modifier state per keyboard: ⇧ held on one keyboard does not shift a key
/// typed on another (Karabiner hid this by merging keyboards into one virtual device).
/// OR the modifiers physically held on any keyboard into key and click events.
fn merge_held_modifiers(etype: u32, event: CGEventRef) {
    use super::keycodes::{
        CGEventGetFlags, CGEventSetFlags, LEFT_DOWN, LEFT_UP, OTHER_DOWN, OTHER_UP, RIGHT_DOWN,
        RIGHT_UP,
    };
    let held = crate::platform::keyboards::held_modifier_bits();
    if held == 0 {
        return;
    }
    // Linkly's own synthetic events carry exactly the modifiers they mean.
    const EVENT_SOURCE_UNIX_PROCESS_ID: u32 = 41;
    let source_pid = unsafe { CGEventGetIntegerValueField(event, EVENT_SOURCE_UNIX_PROCESS_ID) };
    if source_pid == i64::from(std::process::id()) {
        return;
    }
    let mut extra = 0u64;
    for index in 0..8usize {
        if held & (1 << index) == 0 || modifier_is_trigger(index) {
            continue;
        }
        extra |= crate::platform::keyboards::modifier_flags_for_keycode_side(index);
    }
    if extra == 0 {
        return;
    }
    match etype {
        KEY_DOWN | KEY_UP | LEFT_DOWN | LEFT_UP | RIGHT_DOWN | RIGHT_UP | OTHER_DOWN
        | OTHER_UP => {}
        FLAGS_CHANGED => {
            // The event's own modifier is authoritative (its release must not be undone).
            let code = unsafe { CGEventGetIntegerValueField(event, KEYBOARD_EVENT_KEYCODE) } as u16;
            if let Some(index) = hid_modifier_index(code) {
                extra &= !crate::platform::keyboards::modifier_flags_for_keycode_side(index);
            }
        }
        _ => return,
    }
    let flags = unsafe { CGEventGetFlags(event) };
    if extra & !flags != 0 {
        unsafe { CGEventSetFlags(event, flags | extra) };
    }
}

/// macOS modifier keycode → HID modifier index (usage 0xE0 + n).
fn hid_modifier_index(code: u16) -> Option<usize> {
    Some(match code {
        0x3b => 0,
        0x38 => 1,
        0x3a => 2,
        0x37 => 3,
        0x3e => 4,
        0x3c => 5,
        0x3d => 6,
        0x36 => 7,
        _ => return None,
    })
}

/// A modifier bound as a single trigger is swallowed, so the OS never sees it held —
/// do not merge it into other keys either.
fn modifier_is_trigger(index: usize) -> bool {
    let Some(name) = crate::domain::hid_keys::keycode_for_usage(0xE0 + index as u16)
        .and_then(crate::domain::modifier::side_name_from_keycode)
    else {
        return false;
    };
    crate::domain::button_mapping::find_trigger(&Activator::Key { name: name.into() })
        .is_some_and(|entry| !entry.binding.click.is_noop())
}

fn proxy_alias(activator: &Activator) -> Option<Activator> {
    match activator {
        Activator::Key { name } => crate::platform::keyboards::proxy_alias(name),
        _ => None,
    }
}
