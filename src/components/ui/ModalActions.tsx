import { Button } from "./Button";
import { ModalFooter } from "./ModalFooter";

interface ModalActionsProps {
  cancelLabel: string;
  onCancel: () => void;
  confirmLabel?: string;
  onConfirm?: () => void;
  confirmDisabled?: boolean;
}

/** Standard Cancel (+ confirm) footer. */
export const ModalActions = (props: ModalActionsProps) => (
  <ModalFooter>
    <Button variant="ghost" onClick={props.onCancel}>
      {props.cancelLabel}
    </Button>
    {props.confirmLabel !== undefined ? (
      <Button disabled={props.confirmDisabled} onClick={props.onConfirm}>
        {props.confirmLabel}
      </Button>
    ) : null}
  </ModalFooter>
);
