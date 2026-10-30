import { Panel, Muted } from "@/components/ui";
import { useInputDevices } from "@/hooks/useInputDevices";
import { usePrefs } from "@/hooks/prefs";
import { hexPid } from "@/utils/format";
import { buildTransportChips } from "@/utils/deviceTransportDisplay";
import { cx } from "@/utils/cx";

import * as styles from "./ConnectedInputDevices.css";

export const ConnectedInputDevices = () => {
  const { i18n } = usePrefs();
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
            const id = `${device.vendorId}-${device.productId}`;
            const chips = buildTransportChips(
              device.knownTransports ?? [],
              device.activeTransport,
              i18n,
            );
            const showProfileTarget =
              device.profileTarget && !device.isHuge;
            const detailParts = [
              device.manufacturer,
              `${hexPid(device.vendorId)}:${hexPid(device.productId)}`,
              showProfileTarget ? i18n.inputDeviceProfileTarget : null,
            ].filter(Boolean);
            return (
              <li key={id} className={styles.item}>
                <span
                  className={cx(styles.dot, device.connected && styles.dotOn)}
                  aria-hidden
                />
                <div className={styles.meta}>
                  <strong className={styles.name}>{device.productName}</strong>
                  <Muted as="span" className={styles.detail}>
                    {detailParts.join(" · ")}
                    {chips.length > 0 ? (
                      <>
                        {" · "}
                        <span className={styles.transportRow}>
                          {chips.map((chip, index) => (
                            <span key={chip.transport}>
                              {index > 0 ? (
                                <span className={styles.transportSep}>
                                  {" / "}
                                </span>
                              ) : null}
                              <span
                                className={cx(
                                  styles.transportChip,
                                  chip.active
                                    ? styles.transportActive
                                    : styles.transportInactive,
                                )}
                              >
                                {chip.label}
                              </span>
                            </span>
                          ))}
                        </span>
                      </>
                    ) : null}
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
