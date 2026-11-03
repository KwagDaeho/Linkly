import { useCallback, useEffect, useState } from "react";
import { CONNECTED_POLL_MS, REPORT_POLL_MS } from "../constants/polling";
import * as tauri from "../services/tauri";
import type { DeviceInfo, LastReport } from "../types";
const sameReport = (
  previousReport: LastReport | null,
  nextReport: LastReport | null,
): boolean => {
  if (previousReport === null || nextReport === null) {
    return previousReport === nextReport;
  }
  return (
    previousReport.tsMs === nextReport.tsMs &&
    previousReport.hex === nextReport.hex &&
    previousReport.dx === nextReport.dx &&
    previousReport.dy === nextReport.dy &&
    previousReport.wheel === nextReport.wheel &&
    previousReport.pan === nextReport.pan &&
    previousReport.buttons.join() === nextReport.buttons.join()
  );
};
const sameDevice = (
  previous: DeviceInfo | null,
  next: DeviceInfo | null,
): boolean => {
  if (previous === null || next === null) {
    return previous === next;
  }
  return (
    previous.vendorId === next.vendorId &&
    previous.productId === next.productId &&
    previous.productName === next.productName
  );
};
export const useDeviceProbe = () => {
  const [connected, setConnected] = useState<DeviceInfo | null>(null);
  const [report, setReport] = useState<LastReport | null>(null);
  const refresh = useCallback(async () => {
    const [deviceInfo, lastReport] = await Promise.all([
      tauri.getDeviceInfo(),
      tauri.getLastReport(),
    ]);
    setConnected(deviceInfo);
    setReport(lastReport);
  }, []);
  useEffect(() => {
    void refresh();
    const reportIntervalId = window.setInterval(() => {
      void tauri.getLastReport().then((nextReport) => {
        setReport((previousReport) =>
          sameReport(previousReport, nextReport) ? previousReport : nextReport,
        );
      });
    }, REPORT_POLL_MS);
    const connectedIntervalId = window.setInterval(() => {
      void tauri.getDeviceInfo().then((next) => {
        setConnected((previous) =>
          sameDevice(previous, next) ? previous : next,
        );
      });
    }, CONNECTED_POLL_MS);
    return () => {
      window.clearInterval(reportIntervalId);
      window.clearInterval(connectedIntervalId);
    };
  }, [refresh]);
  return {
    connected,
    report,
    refresh,
    isConnected: connected !== null,
  };
};
