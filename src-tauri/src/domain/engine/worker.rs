//! HID worker loop body (spawned by `Engine::start`).

use std::collections::HashMap;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use std::time::{Duration, Instant};

use hidapi::HidApi;
use parking_lot::Mutex;

use crate::domain::ball_scroll;
use crate::domain::button_mapping::{self, ButtonMaps};
use crate::domain::custom_mapping::{self, CustomMaps};
use crate::domain::device::{
    device_identity_key, ButtonId, ButtonState, DeviceIdentityKey, DeviceInfo, InputDeviceStatus,
    ParsedReport, is_wireless_receiver_pid,
};
use crate::domain::engine::input::{
    binding_of, fire_due_key_repeats, fire_due_long_presses, fire_due_scroll_repeats,
    handle_button_transitions, pointer_takeover_active, take_due_scroll_repeats,
    tilt_pan_stream_dx_notches, tilt_side_sustain, tilt_uses_pan_stream, ActionRepeat,
    PendingHold, ScrollRepeat, TiltHoldGate,
};
use crate::domain::engine::LastReport;
use crate::domain::profile::{effective_long_press_ms, Action, Profile};
use crate::domain::remap_session::RemapSession;
use crate::domain::remap;
use crate::persistence::input_device_store;
use crate::platform::hid::{
    build_input_device_statuses, collect_input_snapshot, find_catalog_hid_device, open_catalog_hid_device,
    patch_wireless_rf_link_status, scan_input_snapshot,
};
use crate::platform::{capture, inject, permissions, suppress};

pub(crate) fn run(
    profile: Arc<Mutex<Profile>>,
    profile_dirty: Arc<AtomicBool>,
    session: Arc<RemapSession>,
    running: Arc<AtomicBool>,
    last_report: Arc<Mutex<Option<LastReport>>>,
    connected: Arc<Mutex<Option<DeviceInfo>>>,
    known_input_devices: Arc<Mutex<HashMap<DeviceIdentityKey, DeviceInfo>>>,
    input_devices: Arc<Mutex<Vec<InputDeviceStatus>>>,
    rf_last_hid_input: Arc<Mutex<Option<Instant>>>,
) {
    let mut prev = ButtonState::default();
    let mut prev_raw = ButtonState::default();
    let mut held: HashMap<ButtonId, Action> = HashMap::new();
    let mut pending: HashMap<ButtonId, PendingHold> = HashMap::new();
    let mut scroll_repeats: HashMap<ButtonId, ScrollRepeat> = HashMap::new();
    let mut key_repeats: HashMap<ButtonId, ActionRepeat> = HashMap::new();
    let mut tilt_gate = TiltHoldGate::default();
    let mut api = match HidApi::new() {
        Ok(api) => api,
        Err(err) => {
            log::error!("hidapi init failed: {err}");
            running.store(false, Ordering::SeqCst);
            return;
        }
    };

    let mut profile_snap = profile.lock().clone();
    let mut last_full_device_scan = Instant::now();
    const FULL_DEVICE_SCAN_INTERVAL: Duration = Duration::from_secs(3);

    while running.load(Ordering::SeqCst) {
        // Full USB/BT refresh + open probes are expensive — do not run every loop turn.
        let snapshot = if last_full_device_scan.elapsed() >= FULL_DEVICE_SCAN_INTERVAL {
            last_full_device_scan = Instant::now();
            scan_input_snapshot(&mut api)
        } else {
            collect_input_snapshot(&api)
        };
        let device_info = find_catalog_hid_device(&api);
        *connected.lock() = device_info.clone();

        let profile_enabled = profile_snap.enabled;
        let profile_target = if profile_enabled {
            device_info.as_ref()
        } else {
            None
        };
        {
            let mut known = known_input_devices.lock();
            let (mut statuses, dirty) =
                build_input_device_statuses(&mut known, &snapshot, profile_target);
            apply_wireless_rf_link(
                &api,
                &mut statuses,
                profile_enabled,
                &rf_last_hid_input,
            );
            *input_devices.lock() = statuses;
            if dirty {
                let _ = input_device_store::save_known(&known);
            }
        }

        if profile_dirty.swap(false, Ordering::SeqCst) {
            profile_snap = profile.lock().clone();
            let trigger_device = device_info.as_ref().map(device_identity_key);
            session.sync_runtime(&profile_snap, trigger_device);
        }
        if !profile_snap.enabled {
            // Release any held virtual buttons and don't seize the device.
            for (id, action) in held.drain() {
                inject::release_action(id, &action);
            }
            pending.clear();
            scroll_repeats.clear();
            key_repeats.clear();
            session.clear_maps();
            tilt_gate = TiltHoldGate::default();
            prev = ButtonState::default();
            suppress::clear_suppress();
            std::thread::sleep(Duration::from_millis(400));
            continue;
        }

        if !permissions::accessibility_granted() {
            std::thread::sleep(Duration::from_millis(800));
            continue;
        }

        let Some(info) = device_info else {
            std::thread::sleep(Duration::from_millis(800));
            continue;
        };

        // Always shared: WindowServer keeps the cursor (Dock auto-hide).
        // Remapped primary clicks are swallowed by `suppress` event tap.
        // Wheel invert/speed is applied in-place on the OS ScrollWheel event.
        inject::set_shared_pointer_mode(true);
        #[cfg(target_os = "macos")]
        api.set_open_exclusive(false);
        suppress::ensure_started();
        suppress::sync_scroll_transform(true);

        let device = match open_catalog_hid_device(&api, &info) {
            Ok(d) => d,
            Err(err) => {
                log::warn!("open catalog HID device failed: {err}");
                std::thread::sleep(Duration::from_millis(800));
                continue;
            }
        };

        let _ = device.set_blocking_mode(true);
        inject::sync_cursor_from_system();
        log::info!(
            "catalog shared {:04x}:{:04x} {}",
            info.vendor_id,
            info.product_id,
            info.product_name
        );

        let mut buf = [0u8; 64];
        let mut last_input_scan = Instant::now();
        let mut last_registry_full_scan = Instant::now();
        let trigger_device = Some(device_identity_key(&info));
        while running.load(Ordering::SeqCst) {
            if profile_dirty.swap(false, Ordering::SeqCst) {
                profile_snap = profile.lock().clone();
                session.sync_runtime(&profile_snap, trigger_device);
            }
            let long_press = long_press_threshold(&profile_snap, trigger_device);
            if !profile_snap.enabled {
                *rf_last_hid_input.lock() = None;
                break;
            }
            suppress::sync_scroll_transform(true);

            match device.read_timeout(&mut buf, 8) {
                Ok(0) => {
                    if last_input_scan.elapsed() >= Duration::from_millis(800) {
                        let refresh_list =
                            last_registry_full_scan.elapsed() >= FULL_DEVICE_SCAN_INTERVAL;
                        if refresh_list {
                            last_registry_full_scan = Instant::now();
                            last_full_device_scan = Instant::now();
                        }
                        sync_input_device_registry(
                            &mut api,
                            &profile,
                            &connected,
                            &known_input_devices,
                            &input_devices,
                            &rf_last_hid_input,
                            refresh_list,
                        );
                        last_input_scan = Instant::now();
                    }
                    let now = Instant::now();
                    session.with_maps(&profile_snap, |custom_maps, button_maps| {
                        fire_due_long_presses(
                            &mut pending,
                            &mut held,
                            &profile_snap.pointer,
                            long_press,
                        );
                        custom_mapping::fire_due_ticks(
                            custom_maps,
                            &profile_snap,
                            long_press,
                        );
                        button_mapping::fire_due_ticks(
                            button_maps,
                            &profile_snap,
                            long_press,
                        );
                        fire_due_scroll_repeats(&mut scroll_repeats, &profile_snap.pointer);
                        fire_due_key_repeats(&mut key_repeats, &profile_snap.pointer);
                        tilt_gate.expire(now);
                        ball_scroll::tick();
                        inject::end_idle_ball_scroll();
                        let mut state = prev;
                        tilt_gate.apply(&mut state);
                        custom_mapping::sync_button_state(state);
                        sync_catalog_suppress_mask(
                            prev,
                            state,
                            &profile_snap,
                            capture::input_capture_active(),
                        );
                        custom_mapping::maintain_chords(
                            state,
                            &profile_snap,
                            custom_maps,
                            &mut pending,
                            &mut held,
                            &mut scroll_repeats,
                            &mut key_repeats,
                        );
                        if state != prev {
                            sync_catalog_suppress_mask(
                                prev,
                                state,
                                &profile_snap,
                                capture::input_capture_active(),
                            );
                            apply_button_edges(
                                prev,
                                state,
                                &profile_snap,
                                custom_maps,
                                button_maps,
                                &mut pending,
                                &mut held,
                                &mut scroll_repeats,
                                &mut key_repeats,
                            );
                            arm_remap_release_grace(prev, state, &profile_snap);
                            sync_catalog_suppress_mask(
                                prev,
                                state,
                                &profile_snap,
                                capture::input_capture_active(),
                            );
                            prev = state;
                            if let Some(rep) = last_report.lock().as_mut() {
                                rep.buttons.retain(|b| {
                                    *b != "wheel_tilt_left" && *b != "wheel_tilt_right"
                                });
                                if state.tilt_left {
                                    rep.buttons.push("wheel_tilt_left");
                                }
                                if state.tilt_right {
                                    rep.buttons.push("wheel_tilt_right");
                                }
                            }
                        }
                    });
                    // Pulse (AC off): HID quiet → allow next tilt without pan==0.
                    tilt_gate.clear_pulse_latches_when_idle();
                    inject::expire_restored_cursor_if_due();
                    inject::maintain_restored_cursor();
                    suppress::set_suppress_motion(inject::synthetic_buttons_held());
                    continue;
                }
                Ok(n) => {
                    if is_wireless_receiver_pid(info.vendor_id, info.product_id) {
                        *rf_last_hid_input.lock() = Some(Instant::now());
                    }
                    let data = &buf[..n];
                    let hex = data
                        .iter()
                        .map(|b| format!("{b:02x}"))
                        .collect::<Vec<_>>()
                        .join(" ");

                    let Some(parsed) = ParsedReport::from_bytes(data) else {
                        // Consumer/vendor reports (id 3/4/5…) — never treat as motion/scroll.
                        let report = LastReport {
                            hex,
                            buttons: vec![],
                            dx: 0,
                            dy: 0,
                            wheel: 0,
                            pan: 0,
                            ignored: true,
                            ts_ms: std::time::SystemTime::now()
                                .duration_since(std::time::UNIX_EPOCH)
                                .map(|d| d.as_millis())
                                .unwrap_or(0),
                        };
                        crate::platform::input_monitor::on_hid_report(&report);
                        *last_report.lock() = Some(report);
                        continue;
                    };

                    let raw_buttons = parsed.buttons;

                    let now = Instant::now();
                    let mut state = raw_buttons;
                    let left_sustain =
                        tilt_side_sustain(&profile_snap, ButtonId::WheelTiltLeft);
                    let right_sustain =
                        tilt_side_sustain(&profile_snap, ButtonId::WheelTiltRight);
                    // Pan axis sticks on catalog — gate tilt "down" for actions only.
                    tilt_gate.note_pan(parsed.pan, now, left_sustain, right_sustain);
                    tilt_gate.expire(now);
                    tilt_gate.apply(&mut state);
                    custom_mapping::sync_button_state(state);

                    // Probe: show gated tilt (pulse), not sticky raw pan bits.
                    let buttons = ButtonId::ALL
                        .into_iter()
                        .filter(|id| match id {
                            ButtonId::WheelTiltLeft | ButtonId::WheelTiltRight => {
                                state.is_down(*id)
                            }
                            _ => parsed.buttons.is_down(*id),
                        })
                        .map(|id| id.id_str())
                        .collect::<Vec<_>>();
                    let report = LastReport {
                        hex,
                        buttons,
                        dx: parsed.dx,
                        dy: parsed.dy,
                        wheel: parsed.wheel,
                        pan: parsed.pan,
                        ignored: false,
                        ts_ms: std::time::SystemTime::now()
                            .duration_since(std::time::UNIX_EPOCH)
                            .map(|d| d.as_millis())
                            .unwrap_or(0),
                    };
                    crate::platform::input_monitor::on_hid_report(&report);
                    *last_report.lock() = Some(report);

                    let shared = inject::shared_pointer_mode();

                    // Update suppress mask *before* inject so the tap can
                    // drop the OS click that arrives with this same report.
                    let capture_block = capture::input_capture_active();
                    sync_catalog_suppress_mask(prev, state, &profile_snap, capture_block);

                    ball_scroll::tick();
                    inject::expire_restored_cursor_if_due();
                    inject::tick_restore_cursor(parsed.dx as f64, parsed.dy as f64);
                    inject::maintain_restored_cursor();
                        let ball_scroll_on = ball_scroll::is_active();
                        // Shared: OS moves cursor (Dock). Speed ≥ 1 — extras only when
                    // faster than 1× (dx-raw). Skip extras on wheel/pan reports.
                    {
                        let ignore_ball = ball_scroll::ignore_ball_pointer_motion();
                        let raw_x = if ignore_ball {
                            0.0
                        } else {
                            parsed.dx as f64
                        };
                        let raw_y = if ignore_ball {
                            0.0
                        } else {
                            parsed.dy as f64
                        };
                        let mut dx = raw_x * profile_snap.pointer.speed_x();
                        let mut dy = raw_y * profile_snap.pointer.speed_y();
                        if !profile_snap.pointer.acceleration {
                            let mag = (dx * dx + dy * dy).sqrt();
                            if mag > 10.0 {
                                let flatten = (10.0 / mag).sqrt().clamp(0.5, 1.0);
                                dx *= flatten;
                                dy *= flatten;
                            }
                        }
                        let pan_is_stream_scroll = match parsed.pan.cmp(&0) {
                            std::cmp::Ordering::Less => tilt_uses_pan_stream(
                                &binding_of(
                                    &profile_snap,
                                    ButtonId::WheelTiltLeft,
                                ),
                            ),
                            std::cmp::Ordering::Greater => tilt_uses_pan_stream(
                                &binding_of(
                                    &profile_snap,
                                    ButtonId::WheelTiltRight,
                                ),
                            ),
                            std::cmp::Ordering::Equal => false,
                        };
                        let scrolling =
                            parsed.wheel != 0 || (parsed.pan != 0 && pan_is_stream_scroll);
                        let takeover = pointer_takeover_active(
                            &held,
                            &pending,
                            &state,
                            &profile_snap,
                        ) || session.with_maps(&profile_snap, |custom_maps, _| {
                            custom_mapping::pointer_takeover_active(
                                custom_maps,
                                &state,
                                &profile_snap,
                            )
                        });
                        suppress::set_suppress_motion(inject::synthetic_buttons_held());
                        let (out_x, out_y) = if ball_scroll_on {
                            (0.0, 0.0)
                        } else if shared && !takeover {
                            if scrolling {
                                (0.0, 0.0)
                            } else {
                                (dx - raw_x, dy - raw_y)
                            }
                        } else {
                            (dx, dy)
                        };
                        if out_x != 0.0 || out_y != 0.0 {
                            inject::move_by(out_x, out_y);
                        }
                    }

                    // catalog wheel / tilt-pan — skip inject while ball-as-scroll.
                    // Shared HID still posts the OS wheel; arm echo drop so it
                    // does not mix with ball scroll. Trackpad never arms.
                    let mut scroll_dx_notches = 0.0_f64;
                    let mut scroll_dy_notches = 0.0_f64;
                    let mut scroll_continuous = false;

                    if ball_scroll_on && (parsed.wheel != 0 || parsed.pan != 0) {
                        suppress::arm_catalog_scroll_echo_suppress();
                    }

                    if !ball_scroll_on {
                        if parsed.wheel != 0 {
                            suppress::arm_catalog_scroll_echo_suppress();
                            scroll_dy_notches += parsed.wheel as f64;
                        }
                        if parsed.pan != 0 {
                            let side = if parsed.pan < 0 {
                                ButtonId::WheelTiltLeft
                            } else {
                                ButtonId::WheelTiltRight
                            };
                            let binding = binding_of(&profile_snap, side);
                            suppress::arm_catalog_scroll_echo_suppress();
                            if tilt_uses_pan_stream(&binding) {
                                scroll_dx_notches +=
                                    tilt_pan_stream_dx_notches(&binding, parsed.pan);
                            }
                        }

                        let (rep_dx, rep_dy) = take_due_scroll_repeats(&mut scroll_repeats);
                        if rep_dx != 0 || rep_dy != 0 {
                            scroll_dx_notches += rep_dx as f64 / 3.0;
                            scroll_dy_notches += rep_dy as f64 / 3.0;
                            scroll_continuous = true;
                        }

                        if scroll_dx_notches != 0.0 || scroll_dy_notches != 0.0 {
                            inject::scroll_notches_ex(
                                scroll_dx_notches,
                                scroll_dy_notches,
                                &profile_snap.pointer,
                                scroll_continuous,
                            );
                        }
                    }

                    if ball_scroll_on {
                        inject::keep_pinned_cursor();
                        inject::scroll_ball(
                            parsed.dx,
                            parsed.dy,
                            &profile_snap.ball_scroll,
                        );
                        inject::keep_pinned_cursor();
                    } else {
                        inject::end_idle_ball_scroll();
                    }

                    session.with_maps(&profile_snap, |custom_maps, button_maps| {
                        fire_due_long_presses(
                            &mut pending,
                            &mut held,
                            &profile_snap.pointer,
                            long_press,
                        );
                        custom_mapping::fire_due_ticks(
                            custom_maps,
                            &profile_snap,
                            long_press,
                        );
                        button_mapping::fire_due_ticks(
                            button_maps,
                            &profile_snap,
                            long_press,
                        );
                        fire_due_key_repeats(&mut key_repeats, &profile_snap.pointer);

                        apply_button_edges(
                            prev,
                            state,
                            &profile_snap,
                            custom_maps,
                            button_maps,
                            &mut pending,
                            &mut held,
                            &mut scroll_repeats,
                            &mut key_repeats,
                        );
                        arm_remap_release_grace(prev, state, &profile_snap);
                        sync_catalog_suppress_mask(
                            prev,
                            state,
                            &profile_snap,
                            capture_block,
                        );
                    });

                    prev = state;
                    prev_raw = raw_buttons;
                    suppress::set_suppress_motion(inject::synthetic_buttons_held());
                }
                Err(err) => {
                    log::warn!("catalog HID read error (device gone?): {err}");
                    *connected.lock() = None;
                    break;
                }
            }
        }

        for (id, action) in held.drain() {
            inject::release_action(id, &action);
        }
        session.clear_maps();
        pending.clear();
        scroll_repeats.clear();
        key_repeats.clear();
        tilt_gate = TiltHoldGate::default();
        prev = ButtonState::default();
        prev_raw = ButtonState::default();
        suppress::sync_scroll_transform(false);
        suppress::clear_suppress();
        // Drop device → release exclusive claim so OS can take it if remap off.
        drop(device);
        std::thread::sleep(Duration::from_millis(200));
    }
}

fn sticky_button_down(prev: ButtonState, state: ButtonState, id: ButtonId) -> bool {
    state.is_down(id) || prev.is_down(id)
}

fn catalog_button_remap(profile: &Profile, id: ButtonId, legacy: bool) -> bool {
    legacy
        || ball_scroll::is_reserved_catalog_button(id)
        || custom_mapping::is_reserved_catalog_button(id)
        || button_mapping::is_reserved_catalog_button(id)
}

fn catalog_remap_bit(id: ButtonId) -> u8 {
    use remap::{BIT_BACK, BIT_FORWARD, BIT_LEFT, BIT_MIDDLE, BIT_RIGHT};
    match id {
        ButtonId::Left => BIT_LEFT,
        ButtonId::Right => BIT_RIGHT,
        ButtonId::Middle => BIT_MIDDLE,
        ButtonId::Back => BIT_BACK,
        ButtonId::Forward => BIT_FORWARD,
        _ => 0,
    }
}

fn arm_remap_release_grace(prev: ButtonState, state: ButtonState, profile: &Profile) {
    let (rl, rr, rm, rb, rf) = remap::remap_flags(profile);
    let rows = [
        (ButtonId::Left, rl),
        (ButtonId::Right, rr),
        (ButtonId::Middle, rm),
        (ButtonId::Back, rb),
        (ButtonId::Forward, rf),
    ];
    let mut grace = 0u8;
    for (id, legacy) in rows {
        if !state.released_edges(prev).contains(&id) {
            continue;
        }
        if !catalog_button_remap(profile, id, legacy) {
            continue;
        }
        grace |= catalog_remap_bit(id);
    }
    suppress::arm_catalog_click_grace(grace);
}

/// Keep OS click suppression aligned with HID (incl. idle polls while buttons stay down).
fn sync_catalog_suppress_mask(
    prev: ButtonState,
    state: ButtonState,
    profile: &Profile,
    capture_block: bool,
) {
    let (rl, rr, rm, rb, rf) = remap::remap_flags(profile);
    suppress::set_suppress_mask(remap::mask_for(
        sticky_button_down(prev, state, ButtonId::Left),
        sticky_button_down(prev, state, ButtonId::Right),
        sticky_button_down(prev, state, ButtonId::Middle),
        sticky_button_down(prev, state, ButtonId::Back),
        sticky_button_down(prev, state, ButtonId::Forward),
        (capture_block && state.left)
            || catalog_button_remap(profile, ButtonId::Left, rl),
        (capture_block && state.right)
            || catalog_button_remap(profile, ButtonId::Right, rr),
        (capture_block && state.middle)
            || catalog_button_remap(profile, ButtonId::Middle, rm),
        (capture_block && state.back)
            || catalog_button_remap(profile, ButtonId::Back, rb),
        (capture_block && state.forward)
            || catalog_button_remap(profile, ButtonId::Forward, rf),
    ));
}

fn apply_button_edges(
    prev: ButtonState,
    state: ButtonState,
    profile: &Profile,
    custom_maps: &mut CustomMaps,
    button_maps: &mut ButtonMaps,
    pending: &mut HashMap<ButtonId, PendingHold>,
    held: &mut HashMap<ButtonId, Action>,
    scroll_repeats: &mut HashMap<ButtonId, ScrollRepeat>,
    key_repeats: &mut HashMap<ButtonId, ActionRepeat>,
) {
    note_catalog_button_activators(prev, state);
    if capture::input_capture_active() || capture::ui_modal_active() {
        return;
    }
    custom_mapping::sync_button_state(state);
    custom_mapping::process_os_trigger_queue(profile, custom_maps);
    button_mapping::process_os_trigger_queue(profile, button_maps);
    let mut skip_press = custom_mapping::maintain_chords(
        state,
        profile,
        custom_maps,
        pending,
        held,
        scroll_repeats,
        key_repeats,
    );
    let (skip_rel, skip_from_custom) = custom_mapping::handle_transitions(
        prev,
        state,
        profile,
        custom_maps,
        pending,
        held,
        scroll_repeats,
        key_repeats,
    );
    skip_press.extend(skip_from_custom);
    let (bm_skip_rel, bm_skip_press) = button_mapping::handle_catalog_button_transitions(
        prev,
        state,
        profile,
        button_maps,
        &skip_press,
        &skip_rel,
    );
    skip_press.extend(bm_skip_press);
    let mut skip_rel_all = skip_rel;
    skip_rel_all.extend(bm_skip_rel);
    handle_button_transitions(
        prev,
        state,
        profile,
        pending,
        held,
        scroll_repeats,
        key_repeats,
        &skip_rel_all,
        &skip_press,
    );
}

fn note_catalog_button_activators(prev: ButtonState, state: ButtonState) {
    if capture::combo_trigger_capture_active() {
        for id in state.released_edges(prev) {
            capture::release_combo_capture_token_for_catalog_button(id);
        }
        for id in state.pressed_edges(prev) {
            if id == ButtonId::Left {
                capture::emit_capture_left_pointer();
            } else {
                capture::emit_combo_trigger_catalog_button(id);
            }
        }
        return;
    }
    if capture::activator_capture_active() {
        for id in state.pressed_edges(prev) {
            if id == ButtonId::Left && capture::allow_left_activator() {
                capture::emit_capture_left_pointer();
            } else {
                capture::emit_activator_from_hid(crate::domain::profile::Activator::Device {
                    button: id,
                });
            }
        }
        return;
    }
    if capture::ui_modal_active() {
        for id in state.pressed_edges(prev) {
            if id == ButtonId::Left {
                inject::click_at_cursor();
                return;
            }
        }
    }
    ball_scroll::note_catalog_button_edges(prev, state);
}

fn sync_input_device_registry(
    api: &mut HidApi,
    profile: &Arc<Mutex<Profile>>,
    connected: &Arc<Mutex<Option<DeviceInfo>>>,
    known_input_devices: &Arc<Mutex<HashMap<DeviceIdentityKey, DeviceInfo>>>,
    input_devices: &Arc<Mutex<Vec<InputDeviceStatus>>>,
    rf_last_hid_input: &Arc<Mutex<Option<Instant>>>,
    refresh_list: bool,
) {
    let snapshot = if refresh_list {
        scan_input_snapshot(api)
    } else {
        collect_input_snapshot(api)
    };
    let device_info = find_catalog_hid_device(api);
    *connected.lock() = device_info.clone();
    let profile_enabled = profile.lock().enabled;
    let profile_target = if profile_enabled {
        device_info.as_ref()
    } else {
        None
    };
    let mut known = known_input_devices.lock();
    let (mut statuses, dirty) = build_input_device_statuses(&mut known, &snapshot, profile_target);
    apply_wireless_rf_link(
        api,
        &mut statuses,
        profile_enabled,
        rf_last_hid_input,
    );
    *input_devices.lock() = statuses;
    if dirty {
        let _ = input_device_store::save_known(&known);
    }
}


fn apply_wireless_rf_link(
    api: &HidApi,
    statuses: &mut [InputDeviceStatus],
    profile_enabled: bool,
    rf_last_hid_input: &Arc<Mutex<Option<Instant>>>,
) {
    patch_wireless_rf_link_status(api, statuses, rf_last_hid_input.as_ref(), profile_enabled);
}

fn long_press_threshold(
    profile: &Profile,
    trigger_device: Option<DeviceIdentityKey>,
) -> Duration {
    Duration::from_millis(effective_long_press_ms(profile, trigger_device).clamp(150, 2000))
}
