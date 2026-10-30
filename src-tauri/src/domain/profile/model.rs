use std::collections::HashMap;

use serde::{Deserialize, Serialize};

use crate::domain::device::ButtonId;

use super::action::{Action, MouseClickButton};
use super::activator::{ButtonMappingEntry, CustomMappingEntry};
use super::ball_scroll::BallScrollSettings;
use super::binding::ButtonBinding;
use super::pointer::PointerSettings;

fn default_long_press_ms() -> u64 {
    450
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct InputDeviceSettings {
    #[serde(default)]
    pub individual_link_enabled: bool,
    #[serde(default)]
    pub display_name: Option<String>,
    #[serde(default)]
    pub hidden: bool,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DeviceTriggerOverride {
    #[serde(default)]
    pub button_mappings: Option<Vec<ButtonMappingEntry>>,
    #[serde(default)]
    pub custom_mappings: Option<Vec<CustomMappingEntry>>,
    #[serde(default)]
    pub long_press_ms: Option<u64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Profile {
    pub name: String,
    pub buttons: HashMap<ButtonId, ButtonBinding>,
    pub pointer: PointerSettings,
    /// Ball movement → scroll while a toggle/hold activator is on.
    #[serde(default)]
    pub ball_scroll: BallScrollSettings,
    /// Modifier/key + HUGE button combos with their own bindings.
    #[serde(default)]
    pub custom_mappings: Vec<CustomMappingEntry>,
    /// Captured input → binding rows (UI list mappings).
    #[serde(default)]
    pub button_mappings: Vec<ButtonMappingEntry>,
    /// When true, remap engine is active.
    pub enabled: bool,
    /// Launch with the main window hidden (menu bar / tray only).
    #[serde(default)]
    pub start_minimized: bool,
    /// Hold duration before long-press fires (ms).
    #[serde(default = "default_long_press_ms")]
    pub long_press_ms: u64,
    #[serde(default)]
    pub input_device_settings: HashMap<String, InputDeviceSettings>,
    #[serde(default)]
    pub device_trigger_overrides: HashMap<String, DeviceTriggerOverride>,
}

impl Profile {
    pub fn long_press_threshold(&self) -> std::time::Duration {
        std::time::Duration::from_millis(self.long_press_ms.clamp(150, 2000))
    }
}

impl Default for Profile {
    fn default() -> Self {
        let mut buttons = HashMap::new();
        for id in ButtonId::ALL {
            let action = match id {
                ButtonId::Fn1 => Action::MouseClick {
                    button: MouseClickButton::Middle,
                },
                _ => Action::Default,
            };
            buttons.insert(id, ButtonBinding::from_click(action));
        }

        Self {
            name: "Default".into(),
            buttons,
            pointer: PointerSettings::default(),
            ball_scroll: BallScrollSettings::default(),
            custom_mappings: Vec::new(),
            button_mappings: Vec::new(),
            enabled: true,
            start_minimized: false,
            long_press_ms: default_long_press_ms(),
            input_device_settings: HashMap::new(),
            device_trigger_overrides: HashMap::new(),
        }
    }
}
