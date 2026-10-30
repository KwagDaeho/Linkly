pub(crate) mod input;
mod worker;

use std::collections::HashMap;
use std::panic::{catch_unwind, AssertUnwindSafe};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use std::thread::{self, JoinHandle};

use parking_lot::Mutex;

use crate::domain::device::{device_identity_key, is_wireless_huge, DeviceIdentityKey, DeviceInfo, InputDeviceStatus};
use crate::domain::profile::Profile;
use crate::persistence::input_device_store;

pub struct Engine {
    profile: Arc<Mutex<Profile>>,
    running: Arc<AtomicBool>,
    worker: Mutex<Option<JoinHandle<()>>>,
    last_report: Arc<Mutex<Option<LastReport>>>,
    connected: Arc<Mutex<Option<DeviceInfo>>>,
    known_input_devices: Arc<Mutex<HashMap<DeviceIdentityKey, DeviceInfo>>>,
    input_devices: Arc<Mutex<Vec<InputDeviceStatus>>>,
    /// Last wireless HUGE HID input while remapping (dongle-only scans miss RF-off).
    huge_rf_last_input: Arc<Mutex<Option<std::time::Instant>>>,
}

#[derive(Debug, Clone, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LastReport {
    pub hex: String,
    pub buttons: Vec<&'static str>,
    pub dx: i16,
    pub dy: i16,
    pub wheel: i8,
    pub pan: i8,
    pub ignored: bool,
    pub ts_ms: u128,
}

impl Engine {
    pub fn new(profile: Profile) -> Self {
        Self {
            profile: Arc::new(Mutex::new(profile)),
            running: Arc::new(AtomicBool::new(false)),
            worker: Mutex::new(None),
            last_report: Arc::new(Mutex::new(None)),
            connected: Arc::new(Mutex::new(None)),
            known_input_devices: Arc::new(Mutex::new(input_device_store::load_known())),
            input_devices: Arc::new(Mutex::new(Vec::new())),
            huge_rf_last_input: Arc::new(Mutex::new(None)),
        }
    }

    pub fn input_devices(&self) -> Vec<InputDeviceStatus> {
        self.input_devices.lock().clone()
    }

    pub fn profile(&self) -> Profile {
        self.profile.lock().clone()
    }

    pub fn set_profile(&self, profile: Profile) {
        *self.profile.lock() = profile;
    }

    pub fn connected_device(&self) -> Option<DeviceInfo> {
        self.connected.lock().clone()
    }

    pub fn last_report(&self) -> Option<LastReport> {
        self.last_report.lock().clone()
    }

    pub fn start(&self) {
        if self.running.swap(true, Ordering::SeqCst) {
            return;
        }

        let profile = Arc::clone(&self.profile);
        let running = Arc::clone(&self.running);
        let last_report = Arc::clone(&self.last_report);
        let connected = Arc::clone(&self.connected);
        let known_input_devices = Arc::clone(&self.known_input_devices);
        let input_devices = Arc::clone(&self.input_devices);
        let huge_rf_last_input = Arc::clone(&self.huge_rf_last_input);

        let handle = thread::Builder::new()
            .name("huge-hid-worker".into())
            .spawn(move || {
                let result = catch_unwind(AssertUnwindSafe(|| {
                    worker::run(
                        profile,
                        running,
                        last_report,
                        connected,
                        known_input_devices,
                        input_devices,
                        huge_rf_last_input,
                    );
                }));
                if result.is_err() {
                    log::error!("HID worker thread panicked");
                }
            })
            .expect("spawn HID worker");

        *self.worker.lock() = Some(handle);
    }

    pub fn stop(&self) {
        self.request_stop();
        self.join_worker();
    }

    pub fn request_stop(&self) {
        self.running.store(false, Ordering::SeqCst);
    }

    pub fn join_worker(&self) {
        if let Some(handle) = self.worker.lock().take() {
            match handle.join() {
                Ok(()) => {}
                Err(_) => log::error!("HID worker thread panicked on join"),
            }
        }
    }
}
