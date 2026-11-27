import { ballScrollActivatorForSlot, ballScrollOf } from "@/domain/profile";
import { usePrefs, useProfileCtx, useEditor } from "@/hooks";
import { Panel, SettingsList, SettingsRow, Toggle } from "@/components/ui";
import { ActivatorSlotRow } from "./BallScrollActivatorRow";
import type { BallScrollSlot } from "@/types";

export const BallScrollPanel = () => {
  const { lang, i18n } = usePrefs();
  const { profile, ballScroll } = useProfileCtx();
  const { setEditor } = useEditor();
  if (profile === null) {
    return null;
  }
  const ball = ballScrollOf(profile.ballScroll);
  const handleClear = (slot: BallScrollSlot) => {
    if (slot === "toggle") {
      ballScroll.update({ toggleActivator: null, toggleEnabled: false });
      return;
    }
    ballScroll.update({ holdActivator: null, holdEnabled: false });
  };
  return (
    <Panel variant="plain">
      <SettingsList>
        <SettingsRow stack>
          <ActivatorSlotRow
            label={i18n.ballScrollToggle}
            helpText={i18n.ballScrollToggleHelp}
            activator={ballScrollActivatorForSlot(ball, "toggle")}
            lang={lang}
            emptyLabel={i18n.ballScrollKey}
            clearLabel={i18n.clear}
            onOpenCapture={() =>
              setEditor({ kind: "ball_scroll_activator", slot: "toggle", rejected: null })
            }
            onClear={() => handleClear("toggle")}
          />
        </SettingsRow>
        <SettingsRow stack>
          <ActivatorSlotRow
            label={i18n.ballScrollHold}
            helpText={i18n.ballScrollHoldHelp}
            activator={ballScrollActivatorForSlot(ball, "hold")}
            lang={lang}
            emptyLabel={i18n.ballScrollKey}
            clearLabel={i18n.clear}
            onOpenCapture={() =>
              setEditor({ kind: "ball_scroll_activator", slot: "hold", rejected: null })
            }
            onClear={() => handleClear("hold")}
          />
        </SettingsRow>
        <SettingsRow>
          <label>
            {i18n.ballScrollSpeed} {ball.speed.toFixed(2)}×
            <input
              type="range"
              min={0.1}
              max={5}
              step={0.05}
              value={ball.speed}
              onChange={(event) =>
                ballScroll.update({ speed: Number(event.target.value) })
              }
            />
          </label>
        </SettingsRow>
        <SettingsRow>
          <Toggle
            variant="labelFirst"
            checked={ball.invertVertical}
            onChange={(invertVertical) => ballScroll.update({ invertVertical })}
          >
            {i18n.ballScrollInvertVertical}
          </Toggle>
        </SettingsRow>
        <SettingsRow>
          <Toggle
            variant="labelFirst"
            checked={ball.invertHorizontal}
            onChange={(invertHorizontal) =>
              ballScroll.update({ invertHorizontal })
            }
          >
            {i18n.ballScrollInvertHorizontal}
          </Toggle>
        </SettingsRow>
      </SettingsList>
    </Panel>
  );
};
