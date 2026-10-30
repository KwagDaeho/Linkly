import type { ReactNode } from "react";

import { cx } from "@/utils/cx";

import * as styles from "./settingsList.css";

export const SettingsList = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => <ul className={cx(styles.list, className)}>{children}</ul>;

export const SettingsRow = ({
  children,
  className,
  stack,
}: {
  children: ReactNode;
  className?: string;
  stack?: boolean;
}) => (
  <li className={cx(stack ? styles.itemStack : styles.item, className)}>
    {children}
  </li>
);
