use std::collections::HashMap;

use crate::domain::device::DeviceIdentityKey;
use crate::domain::profile::{ButtonMappingEntry, CustomMappingEntry, Profile};

use super::model::{DeviceTriggerOverride, InputDeviceSettings};

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

pub fn effective_button_mappings(
    profile: &Profile,
    trigger_device: Option<DeviceIdentityKey>,
) -> Vec<ButtonMappingEntry> {
    if let Some(key) = trigger_device.filter(|k| individual_link_enabled(profile, *k)) {
        if let Some(bundle) = override_bundle(profile, key) {
            if let Some(ref maps) = bundle.button_mappings {
                return maps.clone();
            }
        }
    }
    profile.button_mappings.clone()
}

pub fn effective_custom_mappings(
    profile: &Profile,
    trigger_device: Option<DeviceIdentityKey>,
) -> Vec<CustomMappingEntry> {
    if let Some(key) = trigger_device.filter(|k| individual_link_enabled(profile, *k)) {
        if let Some(bundle) = override_bundle(profile, key) {
            if let Some(ref maps) = bundle.custom_mappings {
                return maps.clone();
            }
        }
    }
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

pub fn effective_profile_for_triggers(
    profile: &Profile,
    trigger_device: Option<DeviceIdentityKey>,
) -> Profile {
    let mut next = profile.clone();
    next.button_mappings = effective_button_mappings(profile, trigger_device);
    next.custom_mappings = effective_custom_mappings(profile, trigger_device);
    next.long_press_ms = effective_long_press_ms(profile, trigger_device);
    next
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
