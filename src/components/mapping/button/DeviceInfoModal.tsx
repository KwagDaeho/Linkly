import { useEffect, useRef, useState } from "react";

import { Modal, ModalActions } from "@/components/ui";
import { deviceSettingsOf } from "@/domain/profile/triggerScope";
import { usePrefs, useProfileCtx } from "@/hooks";
import { hexPid } from "@/utils/format";
import type { DeviceInfoSummary } from "@/types";

import * as styles from "./DeviceInfoModal.css";

interface DeviceInfoModalProps {
  device: DeviceInfoSummary;
  onClose: () => void;
}

/** Device details + editable display name (shown on the trigger sub-tab). */
export const DeviceInfoModal = ({ device, onClose }: DeviceInfoModalProps) => {
  const { i18n } = usePrefs();
  const { profile, devices } = useProfileCtx();
  const [name, setName] = useState(
    () => (profile ? deviceSettingsOf(profile, device.deviceKey).displayName : "") ?? "",
  );

  const inputRef = useRef<HTMLInputElement>(null);
  // Modal focuses its dialog (for Esc) after mount; take focus back for typing.
  useEffect(() => {
    const id = window.setTimeout(() => inputRef.current?.focus(), 0);
    return () => window.clearTimeout(id);
  }, []);

  const save = () => {
    devices.setDisplayName(device.deviceKey, name, device.productName);
    onClose();
  };

  // Portal: the trigger pages slide with a transform that would trap a fixed modal.
  return (
    <Modal
      portal
      title={i18n.deviceInfoTitle}
      onBackdropClick={onClose}
      onEscape={onClose}
    >
      <label className={styles.nameField}>
        {i18n.deviceInfoDisplayName}
        <input
          className={styles.nameInput}
          type="text"
          value={name}
          placeholder={device.productName}
          ref={inputRef}
          onChange={(event) => setName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              save();
            }
          }}
        />
      </label>
      <dl className={styles.fields}>
        <dt className={styles.term}>{i18n.deviceInfoProductName}</dt>
        <dd className={styles.value}>{device.productName}</dd>
        <dt className={styles.term}>{i18n.deviceInfoIds}</dt>
        <dd className={styles.value}>
          {hexPid(device.vendorId)} : {hexPid(device.productId)}
        </dd>
        <dt className={styles.term}>{i18n.deviceInfoStatus}</dt>
        <dd className={styles.value}>
          {device.connected ? i18n.deviceInfoConnected : i18n.deviceTriggerDisconnected}
        </dd>
      </dl>
      <ModalActions
        cancelLabel={i18n.cancel}
        onCancel={onClose}
        confirmLabel={i18n.save}
        onConfirm={save}
      />
    </Modal>
  );
};
