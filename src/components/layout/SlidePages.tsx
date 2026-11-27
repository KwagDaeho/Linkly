import { useLayoutEffect, useRef, useState, type ReactNode } from "react";

import { cx } from "@/utils/cx";

import * as styles from "./SlidePages.css";

interface SlidePagesProps {
  ids: string[];
  active: string;
  renderPage: (id: string) => ReactNode;
}

/** Horizontal slide between pages (like the main tabs); height follows the active page. */
export const SlidePages = ({ ids, active, renderPage }: SlidePagesProps) => {
  const pageRefs = useRef(new Map<string, HTMLDivElement>());
  const [height, setHeight] = useState<number | undefined>(undefined);
  const index = Math.max(0, ids.indexOf(active));
  const count = Math.max(ids.length, 1);

  useLayoutEffect(() => {
    const node = pageRefs.current.get(ids[index] ?? "");
    if (node === undefined) {
      return;
    }
    const sync = () => setHeight(node.offsetHeight);
    sync();
    const observer = new ResizeObserver(sync);
    observer.observe(node);
    return () => observer.disconnect();
  }, [ids, index]);

  return (
    <div className={styles.root} style={{ height }}>
      <div
        className={styles.track}
        style={{
          width: `${count * 100}%`,
          transform: `translate3d(-${(index * 100) / count}%, 0, 0)`,
        }}
      >
        {ids.map((id) => {
          const isActive = id === ids[index];
          return (
            <div
              key={id}
              ref={(node) => {
                if (node === null) {
                  pageRefs.current.delete(id);
                } else {
                  pageRefs.current.set(id, node);
                }
              }}
              className={cx(styles.page, !isActive && styles.pageInactive)}
              style={{ flex: `0 0 ${100 / count}%` }}
              role="tabpanel"
              aria-hidden={!isActive}
              inert={!isActive || undefined}
            >
              {renderPage(id)}
            </div>
          );
        })}
      </div>
    </div>
  );
};
