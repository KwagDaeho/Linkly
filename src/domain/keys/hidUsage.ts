/** HID keyboard usages (page 0x07) ↔ labels and Linkly key-stroke names. */

type UsageRow = { usage: number; label: string; name?: string };

const letters: UsageRow[] = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
  .split("")
  .map((ch, i) => ({ usage: 0x04 + i, label: ch, name: ch }));

const digits: UsageRow[] = "1234567890"
  .split("")
  .map((ch, i) => ({ usage: 0x1e + i, label: ch, name: ch }));

const fkeys = (from: number, first: number, count: number): UsageRow[] =>
  Array.from({ length: count }, (_, i) => ({
    usage: from + i,
    label: `F${first + i}`,
    name: `F${first + i}`,
  }));

const ROWS: UsageRow[] = [
  ...letters,
  ...digits,
  { usage: 0x28, label: "Return", name: "Return" },
  { usage: 0x29, label: "Esc", name: "Escape" },
  { usage: 0x2a, label: "Backspace", name: "Delete" },
  { usage: 0x2b, label: "Tab", name: "Tab" },
  { usage: 0x2c, label: "Space", name: "Space" },
  { usage: 0x2d, label: "-", name: "-" },
  { usage: 0x2e, label: "=", name: "=" },
  { usage: 0x2f, label: "[", name: "[" },
  { usage: 0x30, label: "]", name: "]" },
  { usage: 0x31, label: "\\", name: "\\" },
  { usage: 0x32, label: "# (non-US)" },
  { usage: 0x33, label: ";", name: ";" },
  { usage: 0x34, label: "'", name: "'" },
  { usage: 0x35, label: "`", name: "`" },
  { usage: 0x36, label: ",", name: "," },
  { usage: 0x37, label: ".", name: "." },
  { usage: 0x38, label: "/", name: "/" },
  { usage: 0x39, label: "Caps Lock", name: "CapsLock" },
  ...fkeys(0x3a, 1, 12),
  { usage: 0x46, label: "Print Screen" },
  { usage: 0x47, label: "Scroll Lock" },
  { usage: 0x48, label: "Pause" },
  { usage: 0x49, label: "Insert", name: "Insert" },
  { usage: 0x4a, label: "Home", name: "Home" },
  { usage: 0x4b, label: "Page Up", name: "PageUp" },
  { usage: 0x4c, label: "Forward Delete", name: "ForwardDelete" },
  { usage: 0x4d, label: "End", name: "End" },
  { usage: 0x4e, label: "Page Down", name: "PageDown" },
  { usage: 0x4f, label: "→", name: "Right" },
  { usage: 0x50, label: "←", name: "Left" },
  { usage: 0x51, label: "↓", name: "Down" },
  { usage: 0x52, label: "↑", name: "Up" },
  { usage: 0x53, label: "Num Lock / Clear", name: "Clear" },
  { usage: 0x54, label: "Keypad /" },
  { usage: 0x55, label: "Keypad *" },
  { usage: 0x56, label: "Keypad -" },
  { usage: 0x57, label: "Keypad +" },
  { usage: 0x58, label: "Keypad Enter" },
  ...Array.from({ length: 9 }, (_, i) => ({
    usage: 0x59 + i,
    label: `Keypad ${i + 1}`,
  })),
  { usage: 0x62, label: "Keypad 0" },
  { usage: 0x63, label: "Keypad ." },
  { usage: 0x64, label: "\\ (non-US)" },
  { usage: 0x65, label: "Menu" },
  { usage: 0x67, label: "Keypad =" },
  ...fkeys(0x68, 13, 12),
  { usage: 0x75, label: "Help", name: "Help" },
  { usage: 0x90, label: "한/영 (Lang1)" },
  { usage: 0x91, label: "한자 (Lang2)" },
  { usage: 0xe0, label: "Left ⌃", name: "LeftControl" },
  { usage: 0xe1, label: "Left ⇧", name: "LeftShift" },
  { usage: 0xe2, label: "Left ⌥", name: "LeftOption" },
  { usage: 0xe3, label: "Left ⌘", name: "LeftMeta" },
  { usage: 0xe4, label: "Right ⌃", name: "RightControl" },
  { usage: 0xe5, label: "Right ⇧", name: "RightShift" },
  { usage: 0xe6, label: "Right ⌥", name: "RightOption" },
  { usage: 0xe7, label: "Right ⌘", name: "RightMeta" },
];

const BY_USAGE = new Map(ROWS.map((row) => [row.usage, row]));
const BY_NAME = new Map(
  ROWS.filter((row) => row.name !== undefined).map((row) => [row.name!, row.usage]),
);

export const hidUsageLabel = (usage: number): string =>
  BY_USAGE.get(usage)?.label ?? `0x${usage.toString(16).toUpperCase()}`;

/** Single key-stroke name (e.g. `"A"`, `"LeftMeta"`) → HID usage, if it is one key. */
export const hidUsageForKeyName = (name: string): number | undefined =>
  BY_NAME.get(name);
