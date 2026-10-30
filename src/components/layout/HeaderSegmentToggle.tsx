import { useRef, useState, type ReactNode } from "react";

import { headerSegmentHoverNudge } from "@/components/ui/panelLayout";

import { cx } from "@/utils/cx";

import * as styles from "./AppHeader.css";
import { useSegmentPill, type BinarySegment } from "./useSegmentPill";

type Segment = {
  id: string;
  label: ReactNode;
  ariaLabel?: string;
  title?: string;
};

type HeaderSegmentToggleProps = {
  value: string;
  onChange: (id: string) => void;
  segments: readonly [Segment, Segment];
  groupLabel: string;
  className?: string;
};

export const HeaderSegmentToggle = ({
  value,
  onChange,
  segments,
  groupLabel,
  className,
}: HeaderSegmentToggleProps) => {
  const listRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<BinarySegment | null>(null);
  const active: BinarySegment = value === segments[1].id ? 1 : 0;

  const { pillStyle, pillNudging } = useSegmentPill({
    active,
    hover,
    listRef,
    segmentSelector: "button[data-header-segment]",
    hoverNudge: headerSegmentHoverNudge,
  });

  return (
    <div
      ref={listRef}
      className={cx(styles.headerSegment, className)}
      role="group"
      aria-label={groupLabel}
    >
      <span
        className={styles.headerSegmentPill}
        style={pillStyle}
        data-nudge={pillNudging ? "true" : undefined}
        aria-hidden
      />
      {segments.map((segment, index) => {
        const selected = value === segment.id;
        return (
          <button
            key={segment.id}
            type="button"
            data-header-segment=""
            className={cx(
              styles.headerSegmentButton,
              selected && styles.headerSegmentButtonActive,
            )}
            aria-label={segment.ariaLabel}
            title={segment.title}
            aria-pressed={selected}
            onClick={() => onChange(segment.id)}
            onPointerEnter={() => setHover(index as BinarySegment)}
            onPointerLeave={() => setHover(null)}
          >
            {segment.label}
          </button>
        );
      })}
    </div>
  );
};
