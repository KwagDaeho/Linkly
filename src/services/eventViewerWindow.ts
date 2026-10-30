import { PhysicalPosition } from "@tauri-apps/api/dpi";
import {
  WebviewWindow,
} from "@tauri-apps/api/webviewWindow";

import { scaleLayoutPx } from "@/constants/fontScale";
import type { EventViewerChannel } from "@/domain/input/eventViewer";
import { loadFontScale } from "@/utils/theme";

const MAIN_WINDOW_LABEL = "main";

const labelFor = (channel: EventViewerChannel) => `event-viewer-${channel}`;

const urlFor = (channel: EventViewerChannel) =>
  `${window.location.origin}${window.location.pathname}#/viewer/${channel}`;

/** Logical px (before font scale). */
const VIEWER_WIDTH_PX = 560;
const VIEWER_HEIGHT_PX = 720;
const VIEWER_MIN_WIDTH_PX = 420;
const VIEWER_MIN_HEIGHT_PX = 480;

const viewerSize = (fontScale: number) => ({
  width: scaleLayoutPx(VIEWER_WIDTH_PX, fontScale),
  height: scaleLayoutPx(VIEWER_HEIGHT_PX, fontScale),
  minWidth: scaleLayoutPx(VIEWER_MIN_WIDTH_PX, fontScale),
  minHeight: scaleLayoutPx(VIEWER_MIN_HEIGHT_PX, fontScale),
});

/** Place viewer over the center of the main app window. */
const centerOnMainWindow = async (
  viewer: WebviewWindow,
  widthLogical: number,
  heightLogical: number,
): Promise<void> => {
  const main = await WebviewWindow.getByLabel(MAIN_WINDOW_LABEL);
  if (!main) {
    await viewer.center();
    return;
  }
  const scale = await main.scaleFactor();
  const pos = await main.outerPosition();
  const size = await main.outerSize();
  const w = Math.round(widthLogical * scale);
  const h = Math.round(heightLogical * scale);
  const x = pos.x + Math.round((size.width - w) / 2);
  const y = pos.y + Math.round((size.height - h) / 2);
  await viewer.setPosition(new PhysicalPosition(x, y));
};

const waitForViewer = (viewer: WebviewWindow): Promise<void> =>
  new Promise((resolve, reject) => {
    viewer.once("tauri://created", () => resolve());
    viewer.once("tauri://error", (event) => {
      reject(new Error(String(event.payload)));
    });
  });

export const openEventViewerWindow = async (
  channel: EventViewerChannel,
): Promise<void> => {
  const label = labelFor(channel);
  const fontScale = loadFontScale();
  const size = viewerSize(fontScale);
  const existing = await WebviewWindow.getByLabel(label);
  if (existing) {
    await centerOnMainWindow(existing, size.width, size.height);
    await existing.show();
    await existing.setFocus();
    return;
  }
  const title =
    channel === "keyboard" ? "Linkly · Keyboard" : "Linkly · Mouse";
  const viewer = new WebviewWindow(label, {
    url: urlFor(channel),
    title,
    width: size.width,
    height: size.height,
    minWidth: size.minWidth,
    minHeight: size.minHeight,
    resizable: true,
    focus: true,
    center: false,
  });
  await waitForViewer(viewer);
  await centerOnMainWindow(viewer, size.width, size.height);
};
