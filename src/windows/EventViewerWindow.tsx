import { memo, useEffect, useRef, useState } from "react";

import {
  formatEventRowText,
  formatEventTime,
  type EventViewerChannel,
} from "@/domain/input/eventViewer";
import type { ViewerLine } from "@/hooks/useInputEventStream";
import { useEventViewerWindow } from "@/hooks/useEventViewerWindow";
import type { Lang } from "@/types";
import { usePrefs } from "@/hooks/prefs";
import { Button, Panel } from "@/components/ui";
import { OverlayScrollArea, overlayScrollAreaStyles } from "@/components/layout/OverlayScrollArea";

import * as styles from "./EventViewerWindow.css";

const EventRow = memo(({ line, lang }: { line: ViewerLine; lang: Lang }) => (
  <div className={styles.row}>
    <span className={styles.time}>{formatEventTime(line.tsMs)}</span>
    <span className={styles.summary}>{formatEventRowText(line, lang)}</span>
    <span className={styles.device} title={line.device}>
      {line.device ?? ""}
    </span>
  </div>
));

export const EventViewerWindow = ({ channel }: { channel: EventViewerChannel }) => {
  const { i18n, lang } = usePrefs();
  const [memo, setMemo] = useState("");
  const { history, clear, close } = useEventViewerWindow(channel);
  const logScrollRef = useRef<HTMLDivElement>(null);
  const logLabel = channel === "keyboard" ? i18n.inputEventKeyboard : i18n.inputEventMouse;

  useEffect(() => {
    const viewport = logScrollRef.current?.querySelector<HTMLElement>(`.${overlayScrollAreaStyles.viewport}`);
    if (viewport) {
      viewport.scrollTop = viewport.scrollHeight;
    }
    // Last seq, not length: length stops changing once the list is capped.
  }, [history[history.length - 1]?.seq]);

  return (
    <main className={styles.windowRoot}>
      <Panel variant="plain" className={styles.windowPanel}>
        <div className={styles.windowHead}>
          <div className={styles.windowActions}>
            <Button variant="ghost" onClick={clear}>
              {i18n.inputEventClear}
            </Button>
            <Button onClick={close}>{i18n.inputEventClose}</Button>
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
                history.map((line) => <EventRow key={line.seq} line={line} lang={lang} />)
              )}
            </div>
          </OverlayScrollArea>
        </div>
      </Panel>
    </main>
  );
};
