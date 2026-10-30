import { Panel, Muted } from "@/components/ui";
import { useInputDevices } from "@/hooks/useInputDevices";
import { usePrefs } from "@/hooks/prefs";
import { useSession } from "@/hooks/session";
import { hexPid } from "@/utils/format";
import { cx } from "@/utils/cx";

import * as styles from "./ConnectedInputDevices.css";

export const ConnectedInputDevices = () => {
  const { i18n } = usePrefs();
  const { connected } = useSession();
  const { devices, error } = useInputDevices();

  return (
    <Panel variant="plain">
      {error ? (
        <p className={styles.error}>{error}</p>
      ) : devices.length === 0 ? (
        <p className={styles.empty}>{i18n.inputDevicesEmpty}</p>
      ) : (
        <ul className={styles.list}>
          {devices.map((device) => {
            const active =
              connected !== null &&
              connected.vendorId === device.vendorId &&
              connected.productId === device.productId &&
              connected.productName === device.productName;
            const id = `${device.path}-${device.vendorId}-${device.productId}`;
            return (
              <li key={id} className={styles.item}>
                <span
                  className={cx(styles.dot, active && styles.dotOn)}
                  aria-hidden
                />
                <div className={styles.meta}>
                  <strong className={styles.name}>{device.productName}</strong>
                  <Muted as="span" className={styles.detail}>
                    {device.manufacturer} · {hexPid(device.vendorId)}:
                    {hexPid(device.productId)}
                    {active ? ` · ${i18n.inputDeviceProfileTarget}` : ""}
                  </Muted>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
};
