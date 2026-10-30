import * as styles from "./AppHeader.css";

export const AppBrandTitle = () => {
  return <h1 className={styles.title}>Linkly</h1>;
};

/** Same typography as header logo (non-heading). */
export const AppBrandMark = ({ className }: { className?: string }) => {
  return (
    <span className={className ?? styles.title} aria-hidden="true">
      Linkly
    </span>
  );
};
