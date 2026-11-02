//! Shared remap state + fast OS-trigger dispatch (keyboard/mouse from CGEventTap).

use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::mpsc::{self, sync_channel};
use std::sync::{Arc, OnceLock};
use std::thread;
use std::time::Duration;

use parking_lot::Mutex;

use crate::domain::ball_scroll;
use crate::domain::button_mapping::{self, ButtonMaps};
use crate::domain::custom_mapping::{self, CustomMaps};
use crate::domain::device::DeviceIdentityKey;
use crate::domain::profile::Profile;
use crate::domain::watch;

struct Inner {
    profile: Profile,
    trigger_device: Option<DeviceIdentityKey>,
    custom_maps: CustomMaps,
    button_maps: ButtonMaps,
}

pub struct RemapSession {
    inner: Mutex<Inner>,
    wake_tx: mpsc::SyncSender<()>,
}

static INSTALLED: OnceLock<Arc<RemapSession>> = OnceLock::new();

pub fn install(session: Arc<RemapSession>) {
    let _ = INSTALLED.set(session);
}

pub fn poke_os_dispatch() {
    if let Some(session) = INSTALLED.get() {
        let _ = session.wake_tx.try_send(());
    }
}

impl RemapSession {
    pub fn spawn(profile: Profile, running: Arc<AtomicBool>) -> Arc<Self> {
        let (wake_tx, wake_rx) = sync_channel(256);
        let session = Arc::new(Self {
            inner: Mutex::new(Inner {
                profile,
                trigger_device: None,
                custom_maps: CustomMaps::default(),
                button_maps: ButtonMaps::default(),
            }),
            wake_tx,
        });

        let dispatch_target = Arc::clone(&session);
        thread::Builder::new()
            .name("link-os-dispatch".into())
            .spawn(move || {
                while running.load(Ordering::SeqCst) {
                    let _ = wake_rx.recv_timeout(Duration::from_millis(8));
                    dispatch_target.drain_os_trigger_queues();
                }
            })
            .expect("spawn link-os-dispatch");

        session
    }

    pub fn with_maps<R>(
        &self,
        profile: &Profile,
        f: impl FnOnce(&mut CustomMaps, &mut ButtonMaps) -> R,
    ) -> R {
        let _ = profile;
        let mut guard = self.inner.lock();
        let Inner {
            ref mut custom_maps,
            ref mut button_maps,
            ..
        } = &mut *guard;
        f(custom_maps, button_maps)
    }

    pub fn sync_runtime(
        &self,
        profile_snap: &Profile,
        trigger_device: Option<DeviceIdentityKey>,
    ) -> bool {
        let mut guard = self.inner.lock();
        guard.profile = profile_snap.clone();
        guard.trigger_device = trigger_device;
        ball_scroll::sync_from_profile(profile_snap);
        custom_mapping::sync_from_profile(profile_snap, trigger_device);
        let changed = button_mapping::sync_from_profile(profile_snap, trigger_device);
        if changed {
            button_mapping::reset_pressed_state(&mut guard.button_maps, profile_snap);
        }
        if watch::needs_os_event_watch(profile_snap) {
            crate::platform::capture::ensure_watch_tap();
        }
        changed
    }

    pub fn clear_maps(&self) {
        let mut guard = self.inner.lock();
        guard.custom_maps.clear();
        guard.button_maps.clear();
    }

    pub fn drain_os_trigger_queues(&self) {
        let mut guard = self.inner.lock();
        let Inner {
            ref profile,
            ref mut custom_maps,
            ref mut button_maps,
            ..
        } = &mut *guard;
        custom_mapping::process_os_trigger_queue(profile, custom_maps);
        button_mapping::process_os_trigger_queue(profile, button_maps);
    }
}
