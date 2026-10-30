import { useEffect, useRef } from "react";

import {
  formatEventRowText,
  type EventViewerChannel,
} from "@/domain/input/eventViewer";
import { useInputEventStream } from "@/hooks/useInputEventStream";
import { usePrefs } from "@/hooks/prefs";
import * as tauri from "@/services/tauri";
import { Button, Panel } from "@/components/ui";

import * as styles from "@/components/info/InputEventViewerPanel.css";

const formatTime = (tsMs: number): string => {
  const date = new Date(tsMs);
  const base = date.toLocaleTimeString(undefined, {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const ms = String(date.getMilliseconds()).padStart(3, "0");
  return `${base}.${ms}`;
};

export const EventViewerWindow = ({ channel }: { channel: EventViewerChannel }) => {
  const { i18n } = usePrefs();
  const { historyByChannel, latestByChannel, clear } = useInputEventStream(
    true,
    channel,
  );
  const logRef = useRef<HTMLDivElement>(null);
  const history = historyByChannel[channel];
  const latest = latestByChannel[channel];
  const latestText = latest ? formatEventRowText(latest) : "";
  const title =
    channel === "keyboard" ? i18n.inputEventKeyboard : i18n.inputEventMouse;

  useEffect(() => {
    void tauri.setEventViewerChannel(channel, true);
    return () => {
      void tauri.setEventViewerChannel(channel, false);
    };
  }, [channel]);

  useEffect(() => {
    const node = logRef.current;
    if (node) {
      node.scrollTop = node.scrollHeight;
    }
  }, [history.length]);

  return (
    <main className={styles.windowRoot}>
      <Panel>
        <div className={styles.windowHead}>
          <h1 className={styles.windowTitle}>{title}</h1>
          <Button variant="ghost" onClick={clear}>
            {i18n.inputEventClear}
          </Button>
        </div>
        <input
          type="text"
          className={styles.rowInput}
          readOnly
          value={latestText}
          placeholder={i18n.inputEventRowEmpty}
          aria-label={title}
        />
        <div ref={logRef} className={styles.logTall} role="log" aria-label={title}>
          {history.length === 0 ? (
            <p className={styles.logEmpty}>{i18n.inputEventRowEmpty}</p>
          ) : (
            history.map((line, index) => (
              <div key={`${line.tsMs}-${index}`} className={styles.row}>
                <span className={styles.time}>{formatTime(line.tsMs)}</span>
                <span className={styles.summary}>{formatEventRowText(line)}</span>
              </div>
            ))
          )}
        </div>
      </Panel>
    </main>
  );
};
