import type { EventViewerChannel } from "@/domain/input/eventViewer";

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
  return <EventViewerWindow channel={channel} />;
};
