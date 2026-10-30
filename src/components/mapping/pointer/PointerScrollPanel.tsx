import { POINTER_REF_DPI, SCROLL_BASE_HORIZONTAL_PX, SCROLL_BASE_VERTICAL_PX } from "@/constants/pointer";
import {
  invertHorizontalScrollEnabled,
  invertVerticalScrollEnabled,
  pointerSpeedX,
  pointerSpeedY,
  scrollSpeedHorizontal,
  scrollSpeedVertical,
} from "@/domain/profile";
import { usePrefs, useProfileCtx } from "@/hooks";
import { formatSpeedPair } from "@/utils/format";
import { Panel, SettingsList, SettingsRow, Toggle } from "@/components/ui";
import { SpeedRangeControl } from "./SpeedRangeControl";

export const PointerScrollPanel = () => {
  const { i18n } = usePrefs();
  const { profile, pointer } = useProfileCtx();
  if (profile === null) {
    return null;
  }
  const profilePointer = profile.pointer;
  return (
    <Panel variant="plain">
      <SettingsList>
        <SettingsRow>
          <SpeedRangeControl
            label={i18n.speedX}
            display={formatSpeedPair(pointerSpeedX(profilePointer), POINTER_REF_DPI)}
            min={1}
            max={5}
            step={0.05}
            value={pointerSpeedX(profilePointer)}
            onChange={(value) => pointer.update("speedX", value)}
          />
        </SettingsRow>
        <SettingsRow>
          <SpeedRangeControl
            label={i18n.speedY}
            display={formatSpeedPair(pointerSpeedY(profilePointer), POINTER_REF_DPI)}
            min={1}
            max={5}
            step={0.05}
            value={pointerSpeedY(profilePointer)}
            onChange={(value) => pointer.update("speedY", value)}
          />
        </SettingsRow>
        <SettingsRow>
          <SpeedRangeControl
            label={i18n.scrollSpeedVertical}
            display={formatSpeedPair(
              scrollSpeedVertical(profilePointer),
              SCROLL_BASE_VERTICAL_PX,
            )}
            min={0.1}
            max={5}
            step={0.05}
            value={scrollSpeedVertical(profilePointer)}
            onChange={(value) => pointer.update("scrollSpeedVertical", value)}
          />
        </SettingsRow>
        <SettingsRow>
          <SpeedRangeControl
            label={i18n.scrollSpeedHorizontal}
            display={formatSpeedPair(
              scrollSpeedHorizontal(profilePointer),
              SCROLL_BASE_HORIZONTAL_PX,
            )}
            min={0.1}
            max={5}
            step={0.05}
            value={scrollSpeedHorizontal(profilePointer)}
            onChange={(value) => pointer.update("scrollSpeedHorizontal", value)}
          />
        </SettingsRow>
        <SettingsRow>
          <Toggle
            variant="labelFirst"
            checked={profilePointer.acceleration}
            onChange={(value) => pointer.update("acceleration", value)}
          >
            {i18n.acceleration}
          </Toggle>
        </SettingsRow>
        <SettingsRow>
          <Toggle
            variant="labelFirst"
            checked={invertVerticalScrollEnabled(profilePointer)}
            onChange={(value) => pointer.update("invertVerticalScroll", value)}
          >
            {i18n.invertVertical}
          </Toggle>
        </SettingsRow>
        <SettingsRow>
          <Toggle
            variant="labelFirst"
            checked={invertHorizontalScrollEnabled(profilePointer)}
            onChange={(value) =>
              pointer.update("invertHorizontalScroll", value)
            }
          >
            {i18n.invertHorizontal}
          </Toggle>
        </SettingsRow>
      </SettingsList>
    </Panel>
  );
};
