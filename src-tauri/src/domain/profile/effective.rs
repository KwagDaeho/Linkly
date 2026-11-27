use crate::domain::device::DeviceIdentityKey;
use crate::domain::profile::{ButtonMappingEntry, CustomMappingEntry, Profile};

use super::model::DeviceTriggerOverride;

fn settings_key(key: DeviceIdentityKey) -> String {
    format!("{}-{}", key.0, key.1)
}

fn individual_link_enabled(profile: &Profile, key: DeviceIdentityKey) -> bool {
    profile
        .input_device_settings
        .get(&settings_key(key))
        .is_some_and(|s| s.individual_link_enabled)
}

fn override_bundle<'a>(
    profile: &'a Profile,
    key: DeviceIdentityKey,
) -> Option<&'a DeviceTriggerOverride> {
    profile.device_trigger_overrides.get(&settings_key(key))
}

/// Live trigger rows: common rows overlaid by the trigger device's own rows, plus the
/// hidden proxy-key rows of per-keyboard triggers (see `key_remap`).
pub fn effective_button_mappings(
    profile: &Profile,
    trigger_device: Option<DeviceIdentityKey>,
) -> Vec<ButtonMappingEntry> {
    let mut rows = scoped_button_mappings(profile, trigger_device);
    rows.extend(crate::platform::keyboards::proxy_rows());
    rows
}

/// Device rows win over common rows bound to the same input; other common rows stay.
fn scoped_button_mappings(
    profile: &Profile,
    trigger_device: Option<DeviceIdentityKey>,
) -> Vec<ButtonMappingEntry> {
    let device_rows = trigger_device
        .filter(|k| individual_link_enabled(profile, *k))
        .and_then(|key| override_bundle(profile, key))
        .and_then(|bundle| bundle.button_mappings.as_ref());
    let Some(device_rows) = device_rows else {
        return profile.button_mappings.clone();
    };
    let mut rows: Vec<ButtonMappingEntry> = profile
        .button_mappings
        .iter()
        .filter(|common| {
            !device_rows.iter().any(|device| {
                super::activator::activator_options_same(&device.activator, &common.activator)
            })
        })
        .cloned()
        .collect();
    rows.extend(device_rows.iter().cloned());
    rows
}

/// Combo triggers are common: they may mix inputs from several devices.
pub fn effective_custom_mappings(
    profile: &Profile,
    _trigger_device: Option<DeviceIdentityKey>,
) -> Vec<CustomMappingEntry> {
    profile.custom_mappings.clone()
}

pub fn effective_long_press_ms(
    profile: &Profile,
    trigger_device: Option<DeviceIdentityKey>,
) -> u64 {
    if let Some(key) = trigger_device.filter(|k| individual_link_enabled(profile, *k)) {
        if let Some(bundle) = override_bundle(profile, key) {
            if let Some(ms) = bundle.long_press_ms {
                return ms;
            }
        }
    }
    profile.long_press_ms
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn uses_common_when_no_override() {
        let profile = Profile::default();
        assert_eq!(
            effective_button_mappings(&profile, Some((1, 2))).len(),
            profile.button_mappings.len()
        );
    }
}
