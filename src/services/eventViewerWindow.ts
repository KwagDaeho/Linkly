import { WebviewWindow } from "@tauri-apps/api/webviewWindow";

import { scaleLayoutPx } from "@/constants/fontScale";
import type { EventViewerChannel } from "@/domain/input/eventViewer";
import { loadFontScale } from "@/utils/theme";

const labelFor = (channel: EventViewerChannel) => `event-viewer-${channel}`;

const urlFor = (channel: EventViewerChannel) =>
  `${window.location.origin}${window.location.pathname}#/viewer/${channel}`;

export const openEventViewerWindow = async (
  channel: EventViewerChannel,
): Promise<void> => {
  const label = labelFor(channel);
  const existing = await WebviewWindow.getByLabel(label);
  if (existing) {
    await existing.show();
    await existing.setFocus();
    return;
  }
  const title =
    channel === "keyboard" ? "Linkly · Keyboard" : "Linkly · Mouse";
  const fontScale = loadFontScale();
  new WebviewWindow(label, {
    url: urlFor(channel),
    title,
    width: scaleLayoutPx(440, fontScale),
    height: 560,
    minWidth: scaleLayoutPx(360, fontScale),
    minHeight: 320,
    resizable: true,
    focus: true,
  });
};
