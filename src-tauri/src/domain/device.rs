//! Supported catalog trackball hardware IDs and button layout.

pub const CATALOG_VENDOR_ID: u16 = 0x056e;

/// Wired / wireless catalog PIDs (plus revisions). Extended models excluded until catalogued.
pub const CATALOG_PRODUCT_IDS: &[u16] = &[
    0x010c, // M-HT1URBK (wired)
    0x010d, // M-HT1DRBK (wireless)
    0x011c, // M-HT1DRBK revision
    0x019b, // M-HT1URBK revision
];

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ButtonId {
    Left,
    Right,
    Middle,
    Back,
    Forward,
    Fn1,
    Fn2,
    Fn3,
    WheelTiltLeft,
    WheelTiltRight,
}

impl ButtonId {
    pub const ALL: [ButtonId; 10] = [
        ButtonId::Left,
        ButtonId::Right,
        ButtonId::Middle,
        ButtonId::Back,
        ButtonId::Forward,
        ButtonId::Fn1,
        ButtonId::Fn2,
        ButtonId::Fn3,
        ButtonId::WheelTiltLeft,
        ButtonId::WheelTiltRight,
    ];

    pub fn id_str(self) -> &'static str {
        match self {
            ButtonId::Left => "left",
            ButtonId::Right => "right",
            ButtonId::Middle => "middle",
            ButtonId::Back => "back",
            ButtonId::Forward => "forward",
            ButtonId::Fn1 => "fn1",
            ButtonId::Fn2 => "fn2",
            ButtonId::Fn3 => "fn3",
            ButtonId::WheelTiltLeft => "wheel_tilt_left",
            ButtonId::WheelTiltRight => "wheel_tilt_right",
        }
    }

    pub fn label(self) -> &'static str {
        // Default (Korean) — UI localizes via id_str when possible.
        match self {
            ButtonId::Left => "LB",
            ButtonId::Right => "RB",
            ButtonId::Middle => "휠 버튼",
            ButtonId::Back => "◀(뒤로 가기)",
            ButtonId::Forward => "▶(앞으로 가기)",
            ButtonId::Fn1 => "Fn1",
            ButtonId::Fn2 => "Fn2",
            ButtonId::Fn3 => "Fn3",
            ButtonId::WheelTiltLeft => "스크롤 기울이기(왼쪽)",
            ButtonId::WheelTiltRight => "스크롤 기울이기(오른쪽)",
        }
    }

    pub fn is_hidden_from_macos(self) -> bool {
        matches!(self, ButtonId::Fn1 | ButtonId::Fn2 | ButtonId::Fn3)
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, serde::Serialize, serde::Deserialize, Default)]
#[serde(rename_all = "snake_case")]
pub enum HidTransport {
    #[default]
    Unknown,
    Usb,
    Bluetooth,
    BluetoothLowEnergy,
    BuiltIn,
    Virtual,
}

impl HidTransport {
    pub fn from_registry_str(raw: &str) -> Self {
        let norm: String = raw
            .chars()
            .filter(|c| !c.is_whitespace() && *c != '-')
            .flat_map(|c| c.to_lowercase())
            .collect();
        match norm.as_str() {
            "usb" => Self::Usb,
            "bluetooth" => Self::Bluetooth,
            "bluetoothlowenergy" => Self::BluetoothLowEnergy,
            "builtin" => Self::BuiltIn,
            "fake" | "virtual" => Self::Virtual,
            _ => Self::Unknown,
        }
    }

    pub fn indicates_physical_link(self) -> bool {
        matches!(
            self,
            Self::Usb | Self::Bluetooth | Self::BluetoothLowEnergy
        )
    }

    pub fn display_order(self) -> u8 {
        match self {
            Self::Usb => 0,
            Self::BluetoothLowEnergy => 1,
            Self::Bluetooth => 2,
            Self::BuiltIn => 3,
            Self::Unknown => 4,
            Self::Virtual => 5,
        }
    }
}

#[derive(Debug, Clone, PartialEq, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DeviceInfo {
    pub vendor_id: u16,
    pub product_id: u16,
    pub product_name: String,
    pub manufacturer: String,
    pub path: String,
    pub is_catalog_device: bool,
    #[serde(default)]
    pub transport: HidTransport,
    /// Physical link types ever seen for this VID:PID (USB / Bluetooth / BLE).
    #[serde(default)]
    pub known_transports: Vec<HidTransport>,
}

pub fn is_catalog_device(vendor_id: u16, product_id: u16) -> bool {
    vendor_id == CATALOG_VENDOR_ID && CATALOG_PRODUCT_IDS.contains(&product_id)
}

/// 2.4 GHz dongle (`M-HT1DRBK`); USB receiver stays enumerated when the ball power is off.
pub fn is_wireless_receiver_pid(vendor_id: u16, product_id: u16) -> bool {
    vendor_id == CATALOG_VENDOR_ID && matches!(product_id, 0x010d | 0x011c)
}

pub type DeviceIdentityKey = (u16, u16);

pub fn device_identity_key(info: &DeviceInfo) -> DeviceIdentityKey {
    (info.vendor_id, info.product_id)
}

fn product_name_rank(name: &str) -> i32 {
    let n = name.trim();
    if n.is_empty() {
        return -100;
    }
    let lower = n.to_ascii_lowercase();
    if lower == "unknown device" {
        return -50;
    }
    const GENERIC: &[&str] = &[
        "gaming kb",
        "gaming keyboard",
        "keyboard",
        "mouse",
        "wireless mouse",
        "usb receiver",
        "2.4g receiver",
    ];
    if GENERIC.iter().any(|g| lower == *g) {
        return 0;
    }
    if n.contains('-') && n.chars().any(|c| c.is_ascii_digit()) {
        return 30;
    }
    if n.len() >= 6 {
        return 10;
    }
    5
}

/// Pick the more specific marketing / model name when the same VID:PID reports different strings.
pub fn preferred_product_name(a: &str, b: &str) -> String {
    let ra = product_name_rank(a);
    let rb = product_name_rank(b);
    if ra > rb {
        a.to_string()
    } else if rb > ra {
        b.to_string()
    } else if a.len() >= b.len() {
        a.to_string()
    } else {
        b.to_string()
    }
}

pub fn merge_known_transports(a: &[HidTransport], b: &[HidTransport]) -> Vec<HidTransport> {
    use std::collections::HashSet;
    let mut set = HashSet::new();
    for t in a.iter().chain(b.iter()) {
        if t.indicates_physical_link() {
            set.insert(*t);
        }
    }
    let mut out: Vec<_> = set.into_iter().collect();
    out.sort_by_key(|t| t.display_order());
    out
}

pub fn merge_device_info(prev: &DeviceInfo, incoming: &DeviceInfo) -> DeviceInfo {
    let product_name = preferred_product_name(&prev.product_name, &incoming.product_name);
    let manufacturer = if incoming.manufacturer.trim().is_empty()
        || incoming.manufacturer.eq_ignore_ascii_case("unknown")
    {
        prev.manufacturer.clone()
    } else if prev.manufacturer.trim().is_empty()
        || prev.manufacturer.eq_ignore_ascii_case("unknown")
    {
        incoming.manufacturer.clone()
    } else {
        incoming.manufacturer.clone()
    };
    let known_transports = merge_known_transports(
        &merge_known_transports(&prev.known_transports, &incoming.known_transports),
        std::slice::from_ref(&incoming.transport),
    );
    DeviceInfo {
        vendor_id: incoming.vendor_id,
        product_id: incoming.product_id,
        product_name,
        manufacturer,
        path: incoming.path.clone(),
        is_catalog_device: prev.is_catalog_device || incoming.is_catalog_device,
        transport: incoming.transport,
        known_transports,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn preferred_name_favors_model_number() {
        assert_eq!(
            preferred_product_name("Gaming KB", "ML-981"),
            "ML-981"
        );
    }
}

#[derive(Debug, Clone, PartialEq, Eq, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct InputDeviceStatus {
    pub vendor_id: u16,
    pub product_id: u16,
    pub product_name: String,
    pub manufacturer: String,
    pub path: String,
    pub is_catalog_device: bool,
    /// Active physical link when `connected`; otherwise last seen (legacy / fallback).
    pub transport: HidTransport,
    pub connected: bool,
    pub profile_target: bool,
    pub active_transport: Option<HidTransport>,
    pub known_transports: Vec<HidTransport>,
}

#[derive(Debug, Clone, Copy, Default, PartialEq, Eq)]
pub struct ButtonState {
    pub left: bool,
    pub right: bool,
    pub middle: bool,
    pub back: bool,
    pub forward: bool,
    pub fn1: bool,
    pub fn2: bool,
    pub fn3: bool,
    pub tilt_left: bool,
    pub tilt_right: bool,
}

/// catalog mouse report (observed / LinearMouse):
/// ```text
/// 01 | buttons | x_lo x_hi | y_lo y_hi | wheel | pan
/// ```
/// 8-bit XY was wrong: Y low landed in the "wheel" field → ball motion scrolled.
#[derive(Debug, Clone, Copy, Default)]
pub struct ParsedReport {
    pub buttons: ButtonState,
    pub dx: i16,
    pub dy: i16,
    pub wheel: i8,
    pub pan: i8,
}

fn i16_le(lo: u8, hi: u8) -> i16 {
    i16::from_le_bytes([lo, hi])
}

impl ParsedReport {
    pub fn from_bytes(data: &[u8]) -> Option<Self> {
        // Only mouse collection report id 0x01.
        if data.is_empty() || data[0] != 0x01 {
            return None;
        }

        // Need buttons + at least something after.
        if data.len() < 4 {
            return None;
        }

        let b0 = data[1];
        let (dx, dy, wheel, pan) = if data.len() >= 8 {
            // 16-bit relative X/Y (little-endian), then wheel + AC Pan.
            (
                i16_le(data[2], data[3]),
                i16_le(data[4], data[5]),
                data[6] as i8,
                data[7] as i8,
            )
        } else if data.len() >= 6 {
            // Fallback: 8-bit X/Y (short reports).
            (
                data[2] as i8 as i16,
                data[3] as i8 as i16,
                data[4] as i8,
                data[5] as i8,
            )
        } else {
            return None;
        };

        let buttons = ButtonState {
            left: b0 & 0x01 != 0,
            right: b0 & 0x02 != 0,
            middle: b0 & 0x04 != 0,
            back: b0 & 0x08 != 0,
            forward: b0 & 0x10 != 0,
            fn1: b0 & 0x20 != 0,
            fn2: b0 & 0x40 != 0,
            fn3: b0 & 0x80 != 0,
            tilt_left: pan < 0, // raw pan hint — engine gates sticky hold
            tilt_right: pan > 0,
        };

        Some(Self {
            buttons,
            dx,
            dy,
            wheel,
            pan,
        })
    }
}

impl ButtonState {
    pub fn is_down(&self, id: ButtonId) -> bool {
        match id {
            ButtonId::Left => self.left,
            ButtonId::Right => self.right,
            ButtonId::Middle => self.middle,
            ButtonId::Back => self.back,
            ButtonId::Forward => self.forward,
            ButtonId::Fn1 => self.fn1,
            ButtonId::Fn2 => self.fn2,
            ButtonId::Fn3 => self.fn3,
            ButtonId::WheelTiltLeft => self.tilt_left,
            ButtonId::WheelTiltRight => self.tilt_right,
        }
    }

    pub fn pressed_edges(self, prev: Self) -> Vec<ButtonId> {
        ButtonId::ALL
            .into_iter()
            .filter(|&id| self.is_down(id) && !prev.is_down(id))
            .collect()
    }

    pub fn released_edges(self, prev: Self) -> Vec<ButtonId> {
        ButtonId::ALL
            .into_iter()
            .filter(|&id| !self.is_down(id) && prev.is_down(id))
            .collect()
    }

    fn set_down(&mut self, id: ButtonId, down: bool) {
        match id {
            ButtonId::Left => self.left = down,
            ButtonId::Right => self.right = down,
            ButtonId::Middle => self.middle = down,
            ButtonId::Back => self.back = down,
            ButtonId::Forward => self.forward = down,
            ButtonId::Fn1 => self.fn1 = down,
            ButtonId::Fn2 => self.fn2 = down,
            ButtonId::Fn3 => self.fn3 = down,
            ButtonId::WheelTiltLeft => self.tilt_left = down,
            ButtonId::WheelTiltRight => self.tilt_right = down,
        }
    }
}

/// Primary L/R/M/Back/Forward — debounce HID bit dropouts while the ball moves.
pub const CATALOG_MOUSE_BUTTONS: [ButtonId; 5] = [
    ButtonId::Left,
    ButtonId::Right,
    ButtonId::Middle,
    ButtonId::Back,
    ButtonId::Forward,
];

/// Hold through single-frame 0 in the HID button byte (same SSOT as suppress mask).
pub fn sticky_catalog_button_down(prev: ButtonState, state: ButtonState, id: ButtonId) -> bool {
    if CATALOG_MOUSE_BUTTONS.contains(&id) {
        state.is_down(id) || prev.is_down(id)
    } else {
        state.is_down(id)
    }
}

const CATALOG_BUTTON_OFF_FRAMES: u8 = 2;

/// Filters noisy primary-button bits; Fn / tilt come from caller unchanged.
pub struct CatalogButtonDebounce {
    stable: ButtonState,
    off_streak: [u8; 5],
}

impl Default for CatalogButtonDebounce {
    fn default() -> Self {
        Self {
            stable: ButtonState::default(),
            off_streak: [0; 5],
        }
    }
}

impl CatalogButtonDebounce {
    pub fn filter(&mut self, raw: ButtonState) -> ButtonState {
        let mut next = self.stable;
        for (i, id) in CATALOG_MOUSE_BUTTONS.iter().enumerate() {
            if raw.is_down(*id) {
                self.off_streak[i] = 0;
                next.set_down(*id, true);
            } else if self.stable.is_down(*id) {
                self.off_streak[i] = self.off_streak[i].saturating_add(1);
                if self.off_streak[i] >= CATALOG_BUTTON_OFF_FRAMES {
                    next.set_down(*id, false);
                }
            } else {
                next.set_down(*id, false);
            }
        }
        self.stable = next;
        next
    }

    pub fn reset(&mut self) {
        *self = Self::default();
    }
}
