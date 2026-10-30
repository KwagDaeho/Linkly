import { useEffect, useRef, useState } from "react";

import {
  eventViewerChannel,
  type EventViewerChannel,
} from "@/domain/input/eventViewer";
import type { InputEventLine } from "@/types";

const MAX_LINES_PER_CHANNEL = 300;
const FLUSH_MS = 50;

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
  const flushTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!active) {
      pendingRef.current = [];
      if (flushTimerRef.current !== null) {
        window.clearTimeout(flushTimerRef.current);
        flushTimerRef.current = null;
      }
      return;
    }
    let cancelled = false;

    const flush = () => {
      flushTimerRef.current = null;
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
          const channel = eventViewerChannel(line);
          if (onlyChannel !== undefined && channel !== onlyChannel) {
            continue;
          }
          next[channel] = appendLine(next[channel], line);
        }
        return next;
      });
    };

    const unlistenPromise = import("@tauri-apps/api/event").then(({ listen }) =>
      listen<InputEventLine>("input-event", (event) => {
        if (cancelled) {
          return;
        }
        pendingRef.current.push(event.payload);
        if (flushTimerRef.current === null) {
          flushTimerRef.current = window.setTimeout(flush, FLUSH_MS);
        }
      }),
    );
    return () => {
      cancelled = true;
      if (flushTimerRef.current !== null) {
        window.clearTimeout(flushTimerRef.current);
        flushTimerRef.current = null;
      }
      void unlistenPromise.then((unlisten) => unlisten());
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
