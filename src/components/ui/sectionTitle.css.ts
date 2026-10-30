import { style } from "@vanilla-extract/css";

import { staticSectionPadLeft } from "./panelLayout";

/** h2 — Trigger/Trackball, 시스템·이벤트·입력 디바이스 등 */
export const headingH2 = style({
  margin: 0,
  fontSize: "1.125rem",
  fontWeight: 650,
  lineHeight: 1.28,
  letterSpacing: "-0.018em",
  color: "var(--accent)",
});

/** h3 — 버튼·조합·포인터·볼 스크롤 등 Link 아코디언 */
export const headingH3 = style({
  margin: 0,
  fontSize: "1.09375rem",
  fontWeight: 620,
  lineHeight: 1.35,
  letterSpacing: "-0.01em",
  color: "var(--heading-h3)",
});

/** @deprecated use headingH2 */
export const text = headingH2;

/** Info 등 비아코디언 본문 — 아코디언과 같은 들여쓰기, 세로선 없음 */
export const staticSectionBody = style({
  display: "grid",
  gap: 10,
  fontSize: "0.9375rem",
  paddingLeft: staticSectionPadLeft,
  paddingTop: 6,
  paddingBottom: 12,
});

export const staticSection = style({
  display: "grid",
  gap: 12,
  marginBottom: 0,
  paddingTop: 4,
  paddingBottom: 16,
  borderBottom: "1px solid var(--line-accent)",
  selectors: {
    "& + &": {
      paddingTop: 12,
    },
    "&:last-child": {
      borderBottom: "none",
      marginBottom: 0,
      paddingBottom: 0,
    },
  },
});

export const headingShell = style({
  margin: 0,
  fontSize: "inherit",
  fontWeight: "inherit",
  lineHeight: "inherit",
});

export const headingRow = style({
  display: "flex",
  alignItems: "center",
  gap: 8,
  width: "100%",
  padding: "2px 0",
});

export const headingLead = style({
  display: "inline-block",
  width: "1.1rem",
  height: "1.1rem",
  flexShrink: 0,
});

export const contentIndent = style({
  display: "grid",
  gap: 10,
  paddingLeft: "1.2rem",
});

export const sectionGroup = style({
  display: "grid",
  gap: 8,
});

export const sectionGroupFollow = style({
  marginTop: 14,
});

/** Link tab h2 group label (Common / Trackball) — same h2, extra spacing */
export const sectionGroupTitle = style({
  padding: "4px 0 2px",
});
