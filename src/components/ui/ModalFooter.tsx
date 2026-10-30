import type { ReactNode } from "react";

import { cx } from "@/utils/cx";

import { Row } from "./Row";
import * as styles from "./ModalFooter.css";

interface ModalFooterProps {
  children: ReactNode;
  className?: string;
}

export const ModalFooter = (props: ModalFooterProps) => (
  <Row className={cx(styles.root, props.className)}>{props.children}</Row>
);
