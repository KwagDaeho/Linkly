import { useEffect, useMemo, useRef, useState } from "react";

import { useInputEventStream } from "@/hooks/useInputEventStream";
import { usePrefs } from "@/hooks/prefs";
import { Button, Panel, SectionHead, Toggle } from "@/components/ui";

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

export const InputEventViewerPanel = () => {
  const { i18n } = usePrefs();
  const { lines, latest, hidMotion, setHidMotion, clear } =
    useInputEventStream(true);
  const [filter, setFilter] = useState("");

  const logRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const query = filter.trim().toLowerCase();
    if (!query) {
      return lines;
    }
    return lines.filter(
      (line) =>
        line.summary.toLowerCase().includes(query) ||
        line.detail.toLowerCase().includes(query) ||
        line.kind.toLowerCase().includes(query) ||
        line.source.toLowerCase().includes(query),
    );
  }, [filter, lines]);

  useEffect(() => {
    const node = logRef.current;
    if (node) {
      node.scrollTop = node.scrollHeight;
    }
  }, [lines.length, filtered.length]);

  const headline = latest?.summary ?? i18n.inputEventHeadlineEmpty;

  return (
    <Panel>
      <SectionHead title={i18n.inputEventViewer} />
      <p className={styles.help}>{i18n.inputEventViewerHelp}</p>

      <input
        type="text"
        className={styles.headline}
        readOnly
        value={headline}
        aria-label={i18n.inputEventHeadlineLabel}
      />

      <input
        type="search"
        className={styles.filter}
        value={filter}
        onChange={(event) => setFilter(event.target.value)}
        placeholder={i18n.inputEventFilterPlaceholder}
        aria-label={i18n.inputEventFilterPlaceholder}
      />

      <div className={styles.toolbar}>
        <Toggle checked={hidMotion} onChange={setHidMotion}>
          {i18n.inputEventHidMotion}
        </Toggle>
        <Button variant="ghost" onClick={clear}>
          {i18n.inputEventClear}
        </Button>
      </div>

      <div
        ref={logRef}
        className={styles.log}
        role="log"
        aria-live="polite"
        aria-relevant="additions"
      >
        {filtered.length === 0 ? (
          <p className={styles.empty}>{i18n.inputEventEmpty}</p>
        ) : (
          filtered.map((line, index) => (
            <div key={`${line.tsMs}-${index}`} className={styles.row}>
              <span className={styles.time}>{formatTime(line.tsMs)}</span>
              <span className={styles.source} data-source={line.source}>
                {line.source}
              </span>
              <span className={styles.summary}>{line.summary}</span>
            </div>
          ))
        )}
      </div>
    </Panel>
  );
};
