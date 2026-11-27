import { usePrefs } from "@/hooks";

import * as styles from "./mappingPanel.css";

/** Column labels for trigger tables (columns match `mappingTableRow.css`). */
export const MappingTableHead = ({ inputLabel }: { inputLabel: string }) => {
  const { i18n } = usePrefs();
  return (
    <div className={styles.tableHead}>
      <span aria-hidden />
      <span>{inputLabel}</span>
      <span>{i18n.mappingAction}</span>
      <span aria-hidden />
      <span>{i18n.autoClickEnable}</span>
      <span>{i18n.longPressEnable}</span>
      <span>{i18n.mappingActionLong}</span>
      <span aria-hidden />
    </div>
  );
};
