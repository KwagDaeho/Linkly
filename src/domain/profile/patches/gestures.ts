import type { Action, ActionSlot, Profile } from "@/types";
import type {
  GestureEntry,
  GesturePoint,
  GestureSettings,
} from "@/types/profile/gesture";

export const gestureSettingsOf = (profile: Profile): Required<GestureSettings> => ({
  holdActivator: profile.gestures?.holdActivator ?? null,
  toggleActivator: profile.gestures?.toggleActivator ?? null,
  entries: profile.gestures?.entries ?? [],
});

export const withGesturePatch = (
  profile: Profile,
  patch: Partial<GestureSettings>,
): Profile => ({
  ...profile,
  gestures: { ...gestureSettingsOf(profile), ...patch },
});

const withEntries = (
  profile: Profile,
  update: (entries: GestureEntry[]) => GestureEntry[],
): Profile => withGesturePatch(profile, { entries: update(gestureSettingsOf(profile).entries) });

export const withGestureAdded = (profile: Profile, entry: GestureEntry): Profile =>
  withEntries(profile, (entries) => [...entries, entry]);

export const withGestureRemoved = (profile: Profile, id: string): Profile =>
  withEntries(profile, (entries) => entries.filter((entry) => entry.id !== id));

export const withGestureTemplate = (
  profile: Profile,
  id: string,
  template: GesturePoint[],
): Profile =>
  withEntries(profile, (entries) =>
    entries.map((entry) => (entry.id === id ? { ...entry, template } : entry)),
  );

/** Gestures fire once: only the click slot is used. */
export const withGestureSlot = (
  profile: Profile,
  id: string,
  slot: ActionSlot,
  action: Action,
): Profile =>
  slot !== "click"
    ? profile
    : withEntries(profile, (entries) =>
        entries.map((entry) => (entry.id === id ? { ...entry, click: action } : entry)),
      );
