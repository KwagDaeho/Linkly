import {
  DeviceStatus,
  InputEventViewerPanel,
  LaunchSettings,
  PermissionPanel,
} from "@/components/info";
import { useSession } from "@/hooks";
export const InfoTab = () => {
  const { trusted } = useSession();
  return (
    <>
      <DeviceStatus />
      <InputEventViewerPanel />
      {!trusted && <PermissionPanel />}
      <LaunchSettings />
    </>
  );
};
