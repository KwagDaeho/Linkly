//! Keyboard modifier identity (left/right sides).

pub const LEGACY_MODIFIER_ORDER: [&str; 4] = ["Control", "Option", "Shift", "Meta"];

pub const SIDE_MODIFIER_ORDER: [&str; 8] = [
    "LeftControl",
    "RightControl",
    "LeftOption",
    "RightOption",
    "LeftShift",
    "RightShift",
    "LeftMeta",
    "RightMeta",
];

pub const FLAG_CONTROL: u64 = 0x0004_0000;
pub const FLAG_OPTION: u64 = 0x0008_0000;
pub const FLAG_SHIFT: u64 = 0x0002_0000;
pub const FLAG_COMMAND: u64 = 0x0010_0000;

pub fn side_name_from_keycode(code: u16) -> Option<&'static str> {
    Some(match code {
        0x3b => "LeftControl",
        0x3e => "RightControl",
        0x3a => "LeftOption",
        0x3d => "RightOption",
        0x38 => "LeftShift",
        0x3c => "RightShift",
        0x37 => "LeftMeta",
        0x36 => "RightMeta",
        _ => return None,
    })
}

pub fn flag_bit_for_side(side: &str) -> Option<u64> {
    Some(match side {
        "LeftControl" | "RightControl" => FLAG_CONTROL,
        "LeftOption" | "RightOption" => FLAG_OPTION,
        "LeftShift" | "RightShift" => FLAG_SHIFT,
        "LeftMeta" | "RightMeta" => FLAG_COMMAND,
        _ => return None,
    })
}

pub fn is_modifier_name(name: &str) -> bool {
    LEGACY_MODIFIER_ORDER.contains(&name) || SIDE_MODIFIER_ORDER.contains(&name)
}

pub fn legacy_sides(name: &str) -> Option<[&'static str; 2]> {
    Some(match name {
        "Control" => ["LeftControl", "RightControl"],
        "Option" => ["LeftOption", "RightOption"],
        "Shift" => ["LeftShift", "RightShift"],
        "Meta" => ["LeftMeta", "RightMeta"],
        _ => return None,
    })
}

/// Stored vs live key activator (legacy aggregate matches either side).
pub fn key_activators_match(stored: &str, live: &str) -> bool {
    if stored == live {
        return true;
    }
    if let Some(pair) = legacy_sides(stored) {
        return live == pair[0] || live == pair[1];
    }
    if let Some(pair) = legacy_sides(live) {
        return stored == pair[0] || stored == pair[1];
    }
    false
}
