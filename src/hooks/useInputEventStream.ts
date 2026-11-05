import { useEffect, useRef, useState } from "react";

import {
  eventViewerChannels,
  type EventViewerChannel,
} from "@/domain/input/eventViewer";
import type { InputEventLine } from "@/types";

const MAX_LINES_PER_CHANNEL = 300;
const MAX_PENDING = 400;
const FLUSH_MS = 50;

const pushPending = (
  pending: InputEventLine[],
  line: InputEventLine,
): InputEventLine[] => {
  const next = [...pending, line];
  if (next.length <= MAX_PENDING) {
    return next;
  }
  return next.slice(next.length - MAX_PENDING);
};

const appendLine = (
  previous: InputEventLine[],
  line: InputEventLine,
): InputEventLine[] => {
  const next = [...previous, line];
  if (next.length > MAX_LINES_PER_CHANNEL) {
    return next.slice(next.length - MAX_LINES_PER_CHANNEL);
  }
  return next;
};

export const useInputEventStream = (
  active: boolean,
  onlyChannel?: EventViewerChannel,
) => {
  const [historyByChannel, setHistoryByChannel] = useState<
    Record<EventViewerChannel, InputEventLine[]>
  >({ keyboard: [], mouse: [] });
  const pendingRef = useRef<InputEventLine[]>([]);

  useEffect(() => {
    if (!active) {
      pendingRef.current = [];
      return;
    }
    let unlisten: (() => void) | undefined;
    let cancelled = false;

    const flush = () => {
      if (cancelled || pendingRef.current.length === 0) {
        return;
      }
      const batch = pendingRef.current;
      pendingRef.current = [];
      setHistoryByChannel((previous) => {
        const next: Record<EventViewerChannel, InputEventLine[]> = {
          keyboard: [...previous.keyboard],
          mouse: [...previous.mouse],
        };
        for (const line of batch) {
          const channels = eventViewerChannels(line);
          for (const channel of channels) {
            if (onlyChannel !== undefined && channel !== onlyChannel) {
              continue;
            }
            next[channel] = appendLine(next[channel], line);
          }
        }
        return next;
      });
    };

    const intervalId = window.setInterval(flush, FLUSH_MS);

    void import("@tauri-apps/api/event").then(async ({ listen }) => {
      if (cancelled) {
        return;
      }
      const off = await listen<InputEventLine>("input-event", (event) => {
        if (cancelled) {
          return;
        }
        const line = event.payload;
        if (onlyChannel !== undefined) {
          if (!eventViewerChannels(line).includes(onlyChannel)) {
            return;
          }
        }
        pendingRef.current = pushPending(pendingRef.current, line);
      });
      if (cancelled) {
        off();
        return;
      }
      unlisten = off;
    });
    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      unlisten?.();
    };
  }, [active, onlyChannel]);

  const clear = () => {
    pendingRef.current = [];
    if (onlyChannel === undefined) {
      setHistoryByChannel({ keyboard: [], mouse: [] });
      return;
    }
    setHistoryByChannel((previous) => ({
      ...previous,
      [onlyChannel]: [],
    }));
  };

  const latestByChannel: Record<EventViewerChannel, InputEventLine | null> = {
    keyboard:
      historyByChannel.keyboard[historyByChannel.keyboard.length - 1] ?? null,
    mouse: historyByChannel.mouse[historyByChannel.mouse.length - 1] ?? null,
  };

  return {
    historyByChannel,
    latestByChannel,
    clear,
  };
};
