import { ballScrollOf, ballScrollActivatorForSlot } from "@/domain/profile";
import { usePrefs, useProfileCtx, useEditor } from "@/hooks";
import { Panel, SettingsList, SettingsRow, Toggle } from "@/components/ui";
import { BallScrollActivatorRow } from "./BallScrollActivatorRow";
import type { BallScrollSlot } from "@/types";

export const BallScrollPanel = () => {
  const { lang, i18n } = usePrefs();
  const { profile, ballScroll } = useProfileCtx();
  const { setEditor } = useEditor();
  if (profile === null) {
    return null;
  }
  const ball = ballScrollOf(profile.ballScroll);
  const handleEnableChange = (slot: BallScrollSlot, enabled: boolean) => {
    const activator = ballScrollActivatorForSlot(ball, slot);
    if (enabled && activator === null) {
      setEditor({ kind: "ball_scroll_activator", slot, rejected: null });
      return;
    }
    if (slot === "toggle") {
      ballScroll.update({ toggleEnabled: enabled });
      return;
    }
    ballScroll.update({ holdEnabled: enabled });
  };
  const handleClear = (slot: BallScrollSlot) => {
    if (slot === "toggle") {
      ballScroll.update({ toggleActivator: null, toggleEnabled: false });
      return;
    }
    ballScroll.update({ holdActivator: null, holdEnabled: false });
  };
  return (
    <Panel>
      <SettingsList>
        <SettingsRow stack>
          <BallScrollActivatorRow
            slot="toggle"
            ball={ball}
            lang={lang}
            i18n={i18n}
            onOpenCapture={(slot) =>
              setEditor({ kind: "ball_scroll_activator", slot, rejected: null })
            }
            onEnableChange={handleEnableChange}
            onClear={handleClear}
          />
        </SettingsRow>
        <SettingsRow stack>
          <BallScrollActivatorRow
            slot="hold"
            ball={ball}
            lang={lang}
            i18n={i18n}
            onOpenCapture={(slot) =>
              setEditor({ kind: "ball_scroll_activator", slot, rejected: null })
            }
            onEnableChange={handleEnableChange}
            onClear={handleClear}
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
