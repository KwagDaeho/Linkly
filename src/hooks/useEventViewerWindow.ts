import { useEffect } from "react";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";

import type { EventViewerChannel } from "@/domain/input/eventViewer";
import { useInputEventStream } from "@/hooks/useInputEventStream";
import { setEventViewerChannel } from "@/services/tauri";

/**
 * Event viewer window for one channel: subscribes the backend stream while mounted
 * and keeps the window itself from scrolling (the log scrolls inside).
 */
export const useEventViewerWindow = (channel: EventViewerChannel) => {
  const { historyByChannel, clear } = useInputEventStream(true, channel);

  useEffect(() => {
    void setEventViewerChannel(channel, true);
    return () => {
      void setEventViewerChannel(channel, false);
    };
  }, [channel]);

  useEffect(() => {
    const root = document.getElementById("root");
    if (root === null) {
      return;
    }
    const prevOverflow = root.style.overflowY;
    root.style.overflowY = "hidden";
    return () => {
      root.style.overflowY = prevOverflow;
    };
  }, []);

  const close = () => {
    void getCurrentWebviewWindow().close();
  };

  return { history: historyByChannel[channel], clear, close };
};
