import { Button } from "@/components/ui";
import { usePrefs } from "@/hooks";

import * as styles from "./mappingTableRow.css";

export const RowRemoveButton = ({ onClick }: { onClick: () => void }) => {
  const { i18n } = usePrefs();
  return (
    <div className={styles.remove}>
      <Button variant="remove" size="tiny" onClick={onClick}>
        {i18n.remove}
      </Button>
    </div>
  );
};
