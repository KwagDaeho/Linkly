import { useMemo, useRef } from "react";

import { Panel, Muted, Toggle } from "@/components/ui";
import { deviceKeyFromIds } from "@/domain/device/deviceKey";
import { withInputDeviceSettings } from "@/domain/profile/patches/scopedTriggers";
import {
  deviceDisplayName,
  individualLinkEnabled,
} from "@/domain/profile/triggerScope";
import { useFlipListAnimation } from "@/hooks/useFlipListAnimation";
import { useInputDevices } from "@/hooks/useInputDevices";
import { usePrefs } from "@/hooks/prefs";
import { useProfileCtx } from "@/hooks/profile";
import { hexPid } from "@/utils/format";
import { buildTransportChips } from "@/utils/deviceTransportDisplay";
import { cx } from "@/utils/cx";

import * as styles from "./ConnectedInputDevices.css";

const sortDevices = (
  devices: ReturnType<typeof useInputDevices>["devices"],
) =>
  [...devices].sort((a, b) => {
    if (a.connected !== b.connected) {
      return a.connected ? -1 : 1;
    }
    return a.productName.localeCompare(b.productName);
  });

export const ConnectedInputDevices = () => {
  const { i18n } = usePrefs();
  const { devices, error } = useInputDevices();
  const { profile, mutateProfile } = useProfileCtx();
  const listRef = useRef<HTMLUListElement>(null);

  const sorted = useMemo(() => sortDevices(devices), [devices]);

  const orderKey = sorted
    .map((d) => `${deviceKeyFromIds(d.vendorId, d.productId)}:${d.connected ? 1 : 0}`)
    .join("|");

  useFlipListAnimation(listRef, "li[data-flip-id]", orderKey);

  if (profile === null) {
    return null;
  }

  return (
    <Panel variant="plain">
      {error ? (
        <p className={styles.error}>{error}</p>
      ) : sorted.length === 0 ? (
        <p className={styles.empty}>{i18n.inputDevicesEmpty}</p>
      ) : (
        <div className={styles.table}>
          <div className={styles.headerRow} role="row">
            <span className={styles.headerSpacer} aria-hidden />
            <span className={styles.headerDevice} />
            <span className={styles.headerLink}>
              {i18n.inputDeviceIndividualLink}
            </span>
          </div>
          <ul ref={listRef} className={styles.list}>
            {sorted.map((device) => {
              const deviceKey = deviceKeyFromIds(
                device.vendorId,
                device.productId,
              );
              const chips = buildTransportChips(
                device.knownTransports ?? [],
                device.activeTransport,
                i18n,
              );
              const showProfileTarget =
                device.profileTarget && !device.isCatalogDevice;
              const detailParts = [
                device.manufacturer,
                `${hexPid(device.vendorId)}:${hexPid(device.productId)}`,
                showProfileTarget ? i18n.inputDeviceProfileTarget : null,
              ].filter(Boolean);
              const linkOn = individualLinkEnabled(profile, deviceKey);
              return (
                <li
                  key={deviceKey}
                  data-flip-id={deviceKey}
                  className={styles.item}
                >
                  <span
                    className={cx(styles.dot, device.connected && styles.dotOn)}
                    aria-hidden
                  />
                  <div className={styles.meta}>
                    <strong className={styles.name}>
                      {deviceDisplayName(
                        profile,
                        deviceKey,
                        device.productName,
                      )}
                    </strong>
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
                  <div className={styles.actions}>
                    <Toggle
                      variant="inline"
                      checked={linkOn}
                      title={i18n.inputDeviceIndividualLink}
                      onChange={(checked) =>
                        mutateProfile((loaded) =>
                          withInputDeviceSettings(loaded, deviceKey, {
                            individualLinkEnabled: checked,
                          }),
                        )
                      }
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </Panel>
  );
};
