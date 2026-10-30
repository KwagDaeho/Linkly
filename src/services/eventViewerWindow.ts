import { WebviewWindow } from "@tauri-apps/api/webviewWindow";

import type { EventViewerChannel } from "@/domain/input/eventViewer";

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
  new WebviewWindow(label, {
    url: urlFor(channel),
    title,
    width: 440,
    height: 560,
    minWidth: 360,
    minHeight: 320,
    resizable: true,
    focus: true,
  });
};
