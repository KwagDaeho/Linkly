import { useEffect, useRef, useState } from "react";

import {
  eventViewerChannels,
  type EventViewerChannel,
} from "@/domain/input/eventViewer";
import type { InputEventLine } from "@/types";

const MAX_LINES_PER_CHANNEL = 300;
const MAX_PENDING = 400;
const FLUSH_MS = 50;

/** Stable React key: indexes shift once the list is capped, `tsMs` can repeat. */
export type ViewerLine = InputEventLine & { seq: number };

let nextSeq = 0;

/** In-place: the pending buffer is a ref, never React state. */
const pushPending = (pending: ViewerLine[], line: InputEventLine): void => {
  pending.push({ ...line, seq: nextSeq++ });
  if (pending.length > MAX_PENDING) {
    pending.splice(0, pending.length - MAX_PENDING);
  }
};

/** One copy per flush instead of one per line. */
const appendLines = (previous: ViewerLine[], lines: ViewerLine[]): ViewerLine[] => {
  if (lines.length === 0) {
    return previous;
  }
  const next = previous.concat(lines);
  return next.length > MAX_LINES_PER_CHANNEL
    ? next.slice(next.length - MAX_LINES_PER_CHANNEL)
    : next;
};

export const useInputEventStream = (
  active: boolean,
  onlyChannel?: EventViewerChannel,
) => {
  const [historyByChannel, setHistoryByChannel] = useState<
    Record<EventViewerChannel, ViewerLine[]>
  >({ keyboard: [], mouse: [] });
  const pendingRef = useRef<ViewerLine[]>([]);

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
      const added: Record<EventViewerChannel, ViewerLine[]> = { keyboard: [], mouse: [] };
      for (const line of batch) {
        for (const channel of eventViewerChannels(line)) {
          if (onlyChannel !== undefined && channel !== onlyChannel) {
            continue;
          }
          added[channel].push(line);
        }
      }
      setHistoryByChannel((previous) => ({
        keyboard: appendLines(previous.keyboard, added.keyboard),
        mouse: appendLines(previous.mouse, added.mouse),
      }));
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
        pushPending(pendingRef.current, line);
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

  const latestByChannel: Record<EventViewerChannel, ViewerLine | null> = {
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
