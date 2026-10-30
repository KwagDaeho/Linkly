use serde::{Deserialize, Serialize};

use crate::domain::chord_token::mouse_button_for_huge;
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
        self.effective_trigger()
            .as_ref()
            .is_some_and(|t| t.matches_input(activator))
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

/// Single captured input → binding (Link tab button mapping rows).
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ButtonMappingEntry {
    pub id: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub activator: Option<Activator>,
    #[serde(flatten)]
    pub binding: ButtonBinding,
}

impl ButtonMappingEntry {
    pub fn is_valid(&self) -> bool {
        self.activator.is_some()
    }
}

pub fn activator_options_same(a: &Option<Activator>, b: &Option<Activator>) -> bool {
    match (a, b) {
        (None, None) => true,
        (Some(left), Some(right)) => left.same_as(right),
        _ => false,
    }
}

impl Activator {
    /// Match live OS/HID input to a stored activator (incl. legacy off-by-one `Other` numbers).
    pub fn same_as(&self, other: &Self) -> bool {
        if self == other {
            return true;
        }
        match (self, other) {
            (
                Activator::Mouse {
                    button: MouseClickButton::Other { number: a },
                },
                Activator::Mouse {
                    button: MouseClickButton::Other { number: b },
                },
            ) => {
                let a = *a as i64;
                let b = *b as i64;
                a == b || a + 1 == b || a == b + 1
            }
            _ => false,
        }
    }

    /// Match stored activator to live OS/HID input (incl. HUGE ↔ shared pointer mouse).
    pub fn matches_input(&self, other: &Self) -> bool {
        if self.same_as(other) {
            return true;
        }
        match (self, other) {
            (Activator::Huge { button: id }, Activator::Mouse { button: mb })
            | (Activator::Mouse { button: mb }, Activator::Huge { button: id }) => {
                mouse_button_for_huge(*id).as_ref() == Some(mb)
            }
            _ => false,
        }
    }

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
