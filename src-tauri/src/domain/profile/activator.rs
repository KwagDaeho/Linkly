use serde::{Deserialize, Serialize};

use crate::domain::device::ButtonId;

use super::action::MouseClickButton;
use super::binding::ButtonBinding;

/// One physical control that arms ball-scroll: a key, a mouse button, or a HUGE button.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum Activator {
    Key { name: String },
    Mouse { button: MouseClickButton },
    Huge { button: ButtonId },
}

/// Keyboard chord + any captured input (`trigger`) for custom mappings.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ComboActivator {
    #[serde(default)]
    pub modifiers: Vec<String>,
    #[serde(default)]
    pub keys: Vec<String>,
    /// Legacy profiles: HUGE button only. Prefer `trigger`.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub button: Option<ButtonId>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub trigger: Option<Activator>,
}

impl ComboActivator {
    pub fn effective_trigger(&self) -> Option<Activator> {
        if let Some(trigger) = &self.trigger {
            return Some(trigger.clone());
        }
        self.button.map(|button| Activator::Huge { button })
    }

    pub fn is_valid(&self) -> bool {
        (!self.modifiers.is_empty() || !self.keys.is_empty())
            && self.effective_trigger().is_some()
    }

    pub fn triggers_match(&self, activator: &Activator) -> bool {
        self.effective_trigger().as_ref() == Some(activator)
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CustomMappingEntry {
    pub id: String,
    pub activator: ComboActivator,
    #[serde(flatten)]
    pub binding: ButtonBinding,
}

impl Activator {
    pub fn is_left_click(&self) -> bool {
        matches!(
            self,
            Activator::Mouse {
                button: MouseClickButton::Left
            } | Activator::Huge {
                button: ButtonId::Left
            }
        )
    }

    pub fn is_huge_tilt(&self) -> bool {
        matches!(
            self,
            Activator::Huge {
                button: ButtonId::WheelTiltLeft | ButtonId::WheelTiltRight
            }
        )
    }
}
