use std::fs::File;
use std::os::fd::AsRawFd;
use std::time::{Duration, Instant};

use crate::constants::{APP_CONFIG_DIR, INSTANCE_LOCK_FILENAME};

/// Relaunch (`--relaunch`): the previous process may still be tearing down (worker join
/// up to ~1s) when the new one starts — wait for it instead of exiting immediately.
const RELAUNCH_LOCK_WAIT: Duration = Duration::from_secs(8);
const LOCK_RETRY: Duration = Duration::from_millis(150);

pub enum InstanceLock {
    Acquired(File),
    /// Another instance holds the lock.
    Busy,
    /// Lock file could not be created/opened — not evidence of another instance.
    Unavailable(String),
}

/// Exclusive lock under Application Support.
/// Prevents LaunchAgent + "reopen windows" from running two remappers after login.
pub fn acquire_instance_lock(wait_for_previous: bool) -> InstanceLock {
    let Some(dir) = dirs::config_dir().map(|d| d.join(APP_CONFIG_DIR)) else {
        return InstanceLock::Unavailable("config dir unavailable".into());
    };
    if let Err(err) = std::fs::create_dir_all(&dir) {
        return InstanceLock::Unavailable(err.to_string());
    }
    let file = match std::fs::OpenOptions::new()
        .create(true)
        .write(true)
        .truncate(false)
        .open(dir.join(INSTANCE_LOCK_FILENAME))
    {
        Ok(file) => file,
        Err(err) => return InstanceLock::Unavailable(err.to_string()),
    };
    let deadline = Instant::now() + RELAUNCH_LOCK_WAIT;
    loop {
        let rc = unsafe { libc::flock(file.as_raw_fd(), libc::LOCK_EX | libc::LOCK_NB) };
        if rc == 0 {
            return InstanceLock::Acquired(file);
        }
        let err = std::io::Error::last_os_error();
        if err.raw_os_error() != Some(libc::EWOULDBLOCK) {
            return InstanceLock::Unavailable(err.to_string());
        }
        if !wait_for_previous || Instant::now() >= deadline {
            return InstanceLock::Busy;
        }
        std::thread::sleep(LOCK_RETRY);
    }
}
