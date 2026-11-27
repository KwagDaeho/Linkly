//! Per-keyboard single triggers (device overlay on the common ones).
//!
//! CGEvents do not say which keyboard sent them, so device triggers are applied below
//! the event tap: macOS remaps the physical key on that keyboard only (`hidutil`
//! `UserKeyMapping`, matched per VendorID/ProductID).
//! - plain single-key click (no long-press / auto-click) → remapped straight to that key
//! - disabled → remapped to nothing
//! - anything else → remapped to a spare proxy F-key whose hidden trigger row fires the
//!   binding (so long-press, auto-click, macros, … all work)
//!
//! Keys of that keyboard without a device trigger keep the common triggers.

use std::collections::HashMap;

use super::action::{Action, MouseClickButton};
use super::activator::{Activator, ButtonMappingEntry};
use super::model::Profile;

/// HID keyboard/keypad usage page, shifted the way `UserKeyMapping` expects.
const KEYBOARD_PAGE: u64 = 0x7_0000_0000;

/// Spare F-keys used as proxies (HID usage, CGEvent key name). F18 is skipped: it is a
/// common remap target (e.g. right ⌘ → F18 for input switching).
pub const PROXY_KEYS: [(u16, &str); 7] = [
    (0x6F, "F20"),
    (0x6E, "F19"),
    (0x6C, "F17"),
    (0x6B, "F16"),
    (0x6A, "F15"),
    (0x69, "F14"),
    (0x68, "F13"),
];

/// Key-name → HID usage lookups (they live in the platform layer).
pub struct KeyResolver<'a> {
    /// Captured trigger name (`Activator::Key`) → usage.
    pub activator: &'a dyn Fn(&str) -> Option<u16>,
    /// Key-stroke action key name → usage.
    pub stroke: &'a dyn Fn(&str) -> Option<u16>,
}

#[derive(Debug, Default, Clone)]
pub struct DeviceKeyPlan {
    /// device key → `UserKeyMapping` (src, dst) pairs.
    pub pairs: HashMap<String, Vec<(u64, u64)>>,
    /// Hidden trigger rows on proxy keys.
    pub proxy_rows: Vec<ButtonMappingEntry>,
    /// Proxy key name → the input it stands for, when the device trigger simply turns
    /// the key into a mouse button. Capture and other triggers see that button, not the
    /// (reassignable) proxy key.
    pub aliases: HashMap<String, Activator>,
}

enum Route {
    Key(u16),
    Nothing,
    Proxy,
}

fn route(entry: &ButtonMappingEntry, resolve: &KeyResolver) -> Option<Route> {
    let binding = &entry.binding;
    if binding.long_press_enabled || binding.auto_click {
        return Some(Route::Proxy);
    }
    match &binding.click {
        Action::Default => None,
        Action::Disabled => Some(Route::Nothing),
        Action::KeyStroke { keys } if keys.len() == 1 => Some(
            (resolve.stroke)(&keys[0])
                .map(Route::Key)
                .unwrap_or(Route::Proxy),
        ),
        _ => Some(Route::Proxy),
    }
}

/// The action is just "press this mouse button" (picker stores extra buttons as a
/// `ButtonN` key-stroke token).
fn plain_mouse_button(action: &Action) -> Option<MouseClickButton> {
    match action {
        Action::MouseClick { button } => Some(button.clone()),
        Action::KeyStroke { keys } if keys.len() == 1 => {
            crate::platform::inject::mouse_button_from_token(&keys[0])
        }
        _ => None,
    }
}

pub fn plan(profile: &Profile, resolve: &KeyResolver) -> DeviceKeyPlan {
    let mut out = DeviceKeyPlan::default();
    let mut proxies = PROXY_KEYS.iter();
    let mut device_keys: Vec<&String> = profile.device_trigger_overrides.keys().collect();
    device_keys.sort();
    for device_key in device_keys {
        let Some(entries) = &profile.device_trigger_overrides[device_key].button_mappings else {
            continue;
        };
        let mut pairs: Vec<(u64, u64)> = Vec::new();
        for entry in entries {
            let Some(Activator::Key { name }) = &entry.activator else {
                continue;
            };
            let Some(from) = (resolve.activator)(name) else {
                continue;
            };
            let dst = match route(entry, resolve) {
                None => continue,
                Some(Route::Key(usage)) => u64::from(usage),
                Some(Route::Nothing) => 0,
                Some(Route::Proxy) => {
                    let Some((usage, proxy_name)) = proxies.next() else {
                        log::warn!("device trigger {name} on {device_key}: no free proxy key");
                        continue;
                    };
                    if !entry.binding.long_press_enabled && !entry.binding.auto_click {
                        if let Some(button) = plain_mouse_button(&entry.binding.click) {
                            out.aliases.insert(
                                (*proxy_name).into(),
                                Activator::Mouse { button },
                            );
                        }
                    }
                    out.proxy_rows.push(ButtonMappingEntry {
                        id: format!("device-key:{device_key}:{}", entry.id),
                        activator: Some(Activator::Key {
                            name: (*proxy_name).into(),
                        }),
                        binding: entry.binding.clone(),
                    });
                    u64::from(*usage)
                }
            };
            let src = KEYBOARD_PAGE | u64::from(from);
            pairs.retain(|(s, _)| *s != src);
            pairs.push((src, KEYBOARD_PAGE | dst));
        }
        if !pairs.is_empty() {
            out.pairs.insert(device_key.clone(), pairs);
        }
    }
    out
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::domain::profile::action::MouseClickButton;
    use crate::domain::profile::binding::ButtonBinding;
    use crate::domain::profile::model::DeviceTriggerOverride;

    fn entry(id: &str, key: &str, click: Action) -> ButtonMappingEntry {
        ButtonMappingEntry {
            id: id.into(),
            activator: Some(Activator::Key { name: key.into() }),
            binding: ButtonBinding::from_click(click),
        }
    }

    fn usage(name: &str) -> Option<u16> {
        match name {
            "P" => Some(0x13),
            "N" => Some(0x11),
            "M" => Some(0x10),
            "F9" => Some(0x42),
            "LeftMeta" => Some(0xE3),
            "0" => Some(0x27),
            _ => None,
        }
    }

    #[test]
    fn routes_key_none_and_proxy() {
        let mut profile = Profile::default();
        profile.device_trigger_overrides.insert(
            "1-2".into(),
            DeviceTriggerOverride {
                button_mappings: Some(vec![
                    entry("a", "N", Action::KeyStroke { keys: vec!["LeftMeta".into()] }),
                    entry("b", "F9", Action::Disabled),
                    entry(
                        "c",
                        "P",
                        Action::MouseClick {
                            button: MouseClickButton::Left,
                        },
                    ),
                    entry("d", "M", Action::Default),
                ]),
                ..Default::default()
            },
        );
        let resolve = KeyResolver {
            activator: &usage,
            stroke: &usage,
        };
        let plan = plan(&profile, &resolve);
        assert_eq!(
            plan.pairs["1-2"],
            vec![
                (0x7_0000_0011, 0x7_0000_00E3),
                (0x7_0000_0042, 0x7_0000_0000),
                (0x7_0000_0013, 0x7_0000_006F),
            ]
        );
        assert_eq!(plan.proxy_rows.len(), 1);
        assert!(matches!(
            plan.aliases.get("F20"),
            Some(Activator::Mouse { button: MouseClickButton::Left })
        ));
        assert!(matches!(
            &plan.proxy_rows[0].activator,
            Some(Activator::Key { name }) if name == "F20"
        ));
    }
}
