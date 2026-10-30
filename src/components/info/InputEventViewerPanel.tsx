import { useEffect, useRef } from "react";

import { formatEventRowText } from "@/domain/input/eventViewer";
import { useInputEventStream } from "@/hooks/useInputEventStream";
import { usePrefs } from "@/hooks/prefs";
import { Button, Panel } from "@/components/ui";
import type { InputEventLine } from "@/types";

import * as styles from "./InputEventViewerPanel.css";

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

const EventChannel = ({
  label,
  latest,
  history,
  emptyLabel,
}: {
  label: string;
  latest: InputEventLine | null;
  history: InputEventLine[];
  emptyLabel: string;
}) => {
  const logRef = useRef<HTMLDivElement>(null);
  const latestText = latest ? formatEventRowText(latest) : "";

  useEffect(() => {
    const node = logRef.current;
    if (node) {
      node.scrollTop = node.scrollHeight;
    }
  }, [history.length]);

  return (
    <div className={styles.block}>
      <div className={styles.blockHead}>
        <span className={styles.rowLabel}>{label}</span>
      </div>
      <input
        type="text"
        className={styles.rowInput}
        readOnly
        value={latestText}
        placeholder={emptyLabel}
        aria-label={label}
      />
      <div ref={logRef} className={styles.log} role="log" aria-label={label}>
        {history.length === 0 ? (
          <p className={styles.logEmpty}>{emptyLabel}</p>
        ) : (
          history.map((line, index) => (
            <div key={`${line.tsMs}-${index}`} className={styles.row}>
              <span className={styles.time}>{formatTime(line.tsMs)}</span>
              <span className={styles.summary}>{formatEventRowText(line)}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export const InputEventViewerPanel = ({ active = true }: { active?: boolean }) => {
  const { i18n } = usePrefs();
  const { historyByChannel, latestByChannel, clear } = useInputEventStream(active);

  return (
    <Panel>
      <div className={styles.toolbar}>
        <Button variant="ghost" onClick={clear}>
          {i18n.inputEventClear}
        </Button>
      </div>

      <EventChannel
        label={i18n.inputEventKeyboard}
        latest={latestByChannel.keyboard}
        history={historyByChannel.keyboard}
        emptyLabel={i18n.inputEventRowEmpty}
      />
      <EventChannel
        label={i18n.inputEventMouse}
        latest={latestByChannel.mouse}
        history={historyByChannel.mouse}
        emptyLabel={i18n.inputEventRowEmpty}
      />
    </Panel>
  );
};
