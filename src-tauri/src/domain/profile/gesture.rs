use serde::{Deserialize, Serialize};

use super::activator::Activator;
use super::binding::ButtonBinding;

#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
pub struct GesturePoint {
    pub x: f64,
    pub y: f64,
}

/// A drawn shape (screen-oriented: y grows downward) and the action it fires.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GestureEntry {
    pub id: String,
    #[serde(default)]
    pub template: Vec<GesturePoint>,
    #[serde(flatten)]
    pub binding: ButtonBinding,
}

/// Draw-to-act gestures: a hold and/or toggle activator starts drawing; the cursor
/// keeps moving and its trail is shown until the stroke ends.
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GestureSettings {
    #[serde(default)]
    pub hold_activator: Option<Activator>,
    #[serde(default)]
    pub toggle_activator: Option<Activator>,
    #[serde(default)]
    pub entries: Vec<GestureEntry>,
}

impl GestureSettings {
    pub fn activators(&self) -> impl Iterator<Item = &Activator> {
        self.hold_activator.iter().chain(self.toggle_activator.iter())
    }

    pub fn is_configured(&self) -> bool {
        self.activators().next().is_some() && !self.entries.is_empty()
    }
}
