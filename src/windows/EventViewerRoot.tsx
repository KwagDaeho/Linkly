import type { EventViewerChannel } from "@/domain/input/eventViewer";

import * as styles from "@/components/info/InputEventViewerPanel.css";

import { EventViewerWindow } from "./EventViewerWindow";

const parseChannel = (hash: string): EventViewerChannel | null => {
  const match = hash.match(/^#\/viewer\/(keyboard|mouse)$/);
  if (!match) {
    return null;
  }
  return match[1] as EventViewerChannel;
};

export const EventViewerRoot = () => {
  const channel = parseChannel(window.location.hash);
  if (channel === null) {
    return null;
  }
  return (
    <div className={styles.viewerShell}>
      <EventViewerWindow channel={channel} />
    </div>
  );
};
