use serde::de::{self, Deserializer};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum Action {
    /// Keep OS default (or no-op for hidden Fn buttons).
    Default,
    Disabled,
    MouseClick { button: MouseClickButton },
    DoubleClick,
    KeyStroke { keys: Vec<String> },
    System { command: SystemCommand },
    OpenApp {
        bundle_id: String,
        /// Display name from the picker (optional for older profiles).
        #[serde(default, skip_serializing_if = "Option::is_none")]
        name: Option<String>,
    },
    Scroll { dx: i32, dy: i32 },
    Macro { steps: Vec<MacroStep> },
}

impl Action {
    pub fn is_noop(&self) -> bool {
        matches!(self, Action::Disabled | Action::Default)
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum MacroStep {
    KeyStroke { keys: Vec<String> },
    Delay { ms: u64 },
    MouseClick { button: MouseClickButton },
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum MouseClickButton {
    Left,
    Right,
    Middle,
    Back,
    Forward,
    /// Extra mouse buttons (Karabiner `buttonN`, CGEvent button number).
    Other {
        number: u8,
    },
}

/// FE uses `{ "type": "other", "number" }`; legacy/rust uses `{ "other": { "number" } }`.
fn parse_mouse_button_value(v: serde_json::Value) -> Result<MouseClickButton, String> {
    match v {
        serde_json::Value::String(s) => match s.as_str() {
            "left" => Ok(MouseClickButton::Left),
            "right" => Ok(MouseClickButton::Right),
            "middle" => Ok(MouseClickButton::Middle),
            "back" => Ok(MouseClickButton::Back),
            "forward" => Ok(MouseClickButton::Forward),
            other => Err(format!("unknown mouse button {other}")),
        },
        serde_json::Value::Object(map) => {
            if let Some(serde_json::Value::Object(other)) = map.get("other") {
                if let Some(n) = other.get("number").and_then(|n| n.as_u64()) {
                    return Ok(MouseClickButton::Other {
                        number: n as u8,
                    });
                }
            }
            if map.get("type").and_then(|t| t.as_str()) == Some("other") {
                if let Some(n) = map.get("number").and_then(|n| n.as_u64()) {
                    return Ok(MouseClickButton::Other {
                        number: n as u8,
                    });
                }
            }
            Err("invalid mouse button object".into())
        }
        _ => Err("invalid mouse button value".into()),
    }
}

impl<'de> Deserialize<'de> for MouseClickButton {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: Deserializer<'de>,
    {
        let v = serde_json::Value::deserialize(deserializer)?;
        parse_mouse_button_value(v).map_err(de::Error::custom)
    }
}

impl MouseClickButton {
    /// CGEvent `MOUSE_EVENT_BUTTON_NUMBER` when applicable.
    pub fn event_number(&self) -> Option<u8> {
        Some(match self {
            MouseClickButton::Left => 0,
            MouseClickButton::Right => 1,
            MouseClickButton::Middle => 2,
            MouseClickButton::Back => 3,
            MouseClickButton::Forward => 4,
            MouseClickButton::Other { number } => *number,
        })
    }

    pub fn matches_event_number(&self, number: i64) -> bool {
        self.event_number().is_some_and(|n| i64::from(n) == number)
    }
}

impl PartialEq for MouseClickButton {
    fn eq(&self, other: &Self) -> bool {
        self.event_number() == other.event_number()
    }
}

impl Eq for MouseClickButton {}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum SystemCommand {
    MissionControl,
    AppExpose,
    ShowDesktop,
    Launchpad,
    Spotlight,
    AppSwitcher,
    CloseWindow,
    Save,
    Cut,
    Copy,
    Paste,
    Undo,
    Redo,
    VolumeUp,
    VolumeDown,
    Mute,
    PreviousTrack,
    NextTrack,
    PlayPause,
    /// Mission Control: move left a Space (default ⌃←).
    MoveSpaceLeft,
    /// Mission Control: move right a Space (default ⌃→).
    MoveSpaceRight,
}
