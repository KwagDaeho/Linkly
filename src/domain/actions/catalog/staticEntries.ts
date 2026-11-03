import type { CatalogEntry } from "@/types";

/** Hand-curated actions (browser, edit, system, …). */
export const STATIC_CATALOG_ENTRIES: CatalogEntry[] = [
  { id: "default", category: "basic", action: { type: "default" } },
  { id: "disabled", category: "basic", action: { type: "disabled" } },

  {
    id: "safari_back",
    category: "browser",
    action: { type: "key_stroke", keys: ["Meta", "["] },
  },
  {
    id: "safari_forward",
    category: "browser",
    action: { type: "key_stroke", keys: ["Meta", "]"] },
  },
  {
    id: "safari_zoom_in",
    category: "browser",
    action: { type: "key_stroke", keys: ["Meta", "="] },
  },
  {
    id: "safari_zoom_out",
    category: "browser",
    action: { type: "key_stroke", keys: ["Meta", "-"] },
  },
  {
    id: "browser_refresh",
    category: "browser",
    action: { type: "key_stroke", keys: ["Meta", "R"] },
  },
  {
    id: "browser_new_tab",
    category: "browser",
    action: { type: "key_stroke", keys: ["Meta", "T"] },
  },
  {
    id: "browser_close_tab",
    category: "browser",
    action: { type: "key_stroke", keys: ["Meta", "W"] },
  },
  {
    id: "browser_reopen_tab",
    category: "browser",
    action: { type: "key_stroke", keys: ["Meta", "Shift", "T"] },
  },
  {
    id: "browser_focus_url",
    category: "browser",
    action: { type: "key_stroke", keys: ["Meta", "L"] },
  },
  {
    id: "browser_find",
    category: "browser",
    action: { type: "key_stroke", keys: ["Meta", "F"] },
  },
  {
    id: "browser_zoom_reset",
    category: "browser",
    action: { type: "key_stroke", keys: ["Meta", "0"] },
  },
  {
    id: "browser_fullscreen",
    category: "browser",
    action: { type: "key_stroke", keys: ["Ctrl", "Meta", "F"] },
  },
  {
    id: "browser_devtools",
    category: "browser",
    action: { type: "key_stroke", keys: ["Meta", "Alt", "I"] },
  },

  {
    id: "copy",
    category: "edit",
    action: { type: "system", command: "copy" },
  },
  {
    id: "cut",
    category: "edit",
    action: { type: "system", command: "cut" },
  },
  {
    id: "paste",
    category: "edit",
    action: { type: "system", command: "paste" },
  },
  {
    id: "undo",
    category: "edit",
    action: { type: "system", command: "undo" },
  },
  {
    id: "redo",
    category: "edit",
    action: { type: "system", command: "redo" },
  },
  {
    id: "save",
    category: "edit",
    action: { type: "system", command: "save" },
  },
  {
    id: "select_all",
    category: "edit",
    action: { type: "key_stroke", keys: ["Meta", "A"] },
  },
  {
    id: "duplicate",
    category: "edit",
    action: { type: "key_stroke", keys: ["Meta", "D"] },
  },
  {
    id: "find_in_document",
    category: "edit",
    action: { type: "key_stroke", keys: ["Meta", "F"] },
  },
  {
    id: "find_next",
    category: "edit",
    action: { type: "key_stroke", keys: ["Meta", "G"] },
  },
  {
    id: "find_previous",
    category: "edit",
    action: { type: "key_stroke", keys: ["Meta", "Shift", "G"] },
  },

  {
    id: "mission_control",
    category: "system",
    action: { type: "system", command: "mission_control" },
  },
  {
    id: "move_space_left",
    category: "system",
    action: { type: "system", command: "move_space_left" },
  },
  {
    id: "move_space_right",
    category: "system",
    action: { type: "system", command: "move_space_right" },
  },
  {
    id: "app_expose",
    category: "system",
    action: { type: "system", command: "app_expose" },
  },
  {
    id: "show_desktop",
    category: "system",
    action: { type: "system", command: "show_desktop" },
  },
  {
    id: "launchpad",
    category: "system",
    action: { type: "system", command: "launchpad" },
  },
  {
    id: "spotlight",
    category: "system",
    action: { type: "system", command: "spotlight" },
  },
  {
    id: "app_switcher",
    category: "system",
    action: { type: "system", command: "app_switcher" },
  },
  {
    id: "close_window",
    category: "system",
    action: { type: "system", command: "close_window" },
  },
  {
    id: "lock_screen",
    category: "system",
    action: { type: "key_stroke", keys: ["Ctrl", "Meta", "Q"] },
  },
  {
    id: "screenshot_full",
    category: "system",
    action: { type: "key_stroke", keys: ["Meta", "Shift", "3"] },
  },
  {
    id: "screenshot_region",
    category: "system",
    action: { type: "key_stroke", keys: ["Meta", "Shift", "4"] },
  },
  {
    id: "screenshot_window",
    category: "system",
    action: { type: "key_stroke", keys: ["Meta", "Shift", "4", "Space"] },
  },
  {
    id: "emoji_picker",
    category: "system",
    action: { type: "key_stroke", keys: ["Ctrl", "Meta", "Space"] },
  },
  {
    id: "input_source_next",
    category: "system",
    action: { type: "system", command: "input_source_next" },
  },
  {
    id: "input_source_previous",
    category: "system",
    action: { type: "system", command: "input_source_previous" },
  },
  {
    id: "force_quit",
    category: "system",
    action: { type: "key_stroke", keys: ["Meta", "Alt", "Escape"] },
  },
  {
    id: "minimize_window",
    category: "system",
    action: { type: "key_stroke", keys: ["Meta", "M"] },
  },
  {
    id: "hide_app",
    category: "system",
    action: { type: "key_stroke", keys: ["Meta", "H"] },
  },
  {
    id: "quit_app",
    category: "system",
    action: { type: "key_stroke", keys: ["Meta", "Q"] },
  },

  {
    id: "volume_up",
    category: "media",
    action: { type: "system", command: "volume_up" },
  },
  {
    id: "volume_down",
    category: "media",
    action: { type: "system", command: "volume_down" },
  },
  {
    id: "mute",
    category: "media",
    action: { type: "system", command: "mute" },
  },
  {
    id: "previous_track",
    category: "media",
    action: { type: "system", command: "previous_track" },
  },
  {
    id: "next_track",
    category: "media",
    action: { type: "system", command: "next_track" },
  },
  {
    id: "play_pause",
    category: "media",
    action: { type: "system", command: "play_pause" },
  },

  {
    id: "open_safari",
    category: "launch",
    action: { type: "open_app", bundle_id: "com.apple.Safari" },
  },
  {
    id: "open_finder",
    category: "launch",
    action: { type: "open_app", bundle_id: "com.apple.finder" },
  },
  {
    id: "open_settings",
    category: "launch",
    action: {
      type: "open_app",
      bundle_id: "com.apple.systempreferences",
    },
  },
  {
    id: "open_terminal",
    category: "launch",
    action: { type: "open_app", bundle_id: "com.apple.Terminal" },
  },
  {
    id: "open_app_pick",
    category: "launch",
    action: { type: "open_app", bundle_id: "" },
    special: "open_app",
  },

  {
    id: "custom_key",
    category: "custom",
    action: { type: "key_stroke", keys: [] },
    special: "custom_key",
  },
  {
    id: "macro",
    category: "custom",
    action: { type: "macro", steps: [] },
    special: "macro",
  },
];
