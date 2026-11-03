import { useEffect, useRef, useState } from "react";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";

import { formatEventRowText, type EventViewerChannel } from "@/domain/input/eventViewer";
import { useInputEventStream } from "@/hooks/useInputEventStream";
import { usePrefs } from "@/hooks/prefs";
import * as tauri from "@/services/tauri";
import { Button, Panel } from "@/components/ui";
import { OverlayScrollArea, overlayScrollAreaStyles } from "@/components/layout/OverlayScrollArea";

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
  const [memo, setMemo] = useState("");
  const { historyByChannel, clear } = useInputEventStream(true, channel);
  const logScrollRef = useRef<HTMLDivElement>(null);
  const history = historyByChannel[channel];
  const logLabel = channel === "keyboard" ? i18n.inputEventKeyboard : i18n.inputEventMouse;

  useEffect(() => {
    void tauri.setEventViewerChannel(channel, true);
    return () => {
      void tauri.setEventViewerChannel(channel, false);
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

  useEffect(() => {
    const viewport = logScrollRef.current?.querySelector<HTMLElement>(`.${overlayScrollAreaStyles.viewport}`);
    if (viewport) {
      viewport.scrollTop = viewport.scrollHeight;
    }
  }, [history.length]);

  const closeWindow = () => {
    void getCurrentWebviewWindow().close();
  };

  return (
    <main className={styles.windowRoot}>
      <Panel variant="plain" className={styles.windowPanel}>
        <div className={styles.windowHead}>
          <div className={styles.windowActions}>
            <Button variant="ghost" onClick={clear}>
              {i18n.inputEventClear}
            </Button>
            <Button onClick={closeWindow}>{i18n.inputEventClose}</Button>
          </div>
        </div>
        {channel === "keyboard" ? (
          <input
            type="text"
            className={styles.memoInput}
            value={memo}
            onChange={(event) => setMemo(event.target.value)}
            placeholder={i18n.inputEventMemoPlaceholder}
            spellCheck={false}
            aria-label={i18n.inputEventMemoPlaceholder}
          />
        ) : null}
        <div ref={logScrollRef} className={styles.logScrollWrap}>
          <OverlayScrollArea className={styles.logTall} contentKey={channel}>
            <div role="log" aria-label={logLabel}>
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
          </OverlayScrollArea>
        </div>
      </Panel>
    </main>
  );
};
