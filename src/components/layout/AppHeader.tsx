import { MoonIcon, SunIcon } from "@/components/icons";
import { IconButton } from "@/components/ui";
import {
  FONT_SCALE_MAX,
  FONT_SCALE_MIN,
} from "@/constants/fontScale";
import { usePrefs } from "@/hooks";
import { cx } from "@/utils/cx";

import { AccentColorPicker } from "./AccentColorPicker";
import { AppBrandTitle } from "./AppBrandTitle";
import * as styles from "./AppHeader.css";
import { HeaderSegmentToggle } from "./HeaderSegmentToggle";

export const AppHeader = () => {
  const {
    lang,
    theme,
    fontScale,
    i18n,
    setLang,
    setTheme,
    decreaseFontScale,
    increaseFontScale,
  } = usePrefs();
  return (
    <header className={styles.hero}>
      <div className={styles.heroTop}>
        <AppBrandTitle />
        <div className={styles.toolbarStack}>
          <div
            className={styles.fontScaleToggle}
            role="group"
            aria-label={i18n.fontSizeScale}
          >
            <IconButton
              data-own-hover=""
              className={cx(
                styles.fontScaleButton,
                fontScale <= FONT_SCALE_MIN && styles.fontScaleButtonDisabled,
              )}
              label={i18n.fontSizeDecrease}
              disabled={fontScale <= FONT_SCALE_MIN}
              onClick={decreaseFontScale}
            >
              −
            </IconButton>
            <span className={styles.fontScaleValue} aria-live="polite">
              {fontScale}%
            </span>
            <IconButton
              data-own-hover=""
              className={cx(
                styles.fontScaleButton,
                fontScale >= FONT_SCALE_MAX && styles.fontScaleButtonDisabled,
              )}
              label={i18n.fontSizeIncrease}
              disabled={fontScale >= FONT_SCALE_MAX}
              onClick={increaseFontScale}
            >
              +
            </IconButton>
          </div>
          <div className={styles.toolbarRow}>
            <AccentColorPicker />
            <HeaderSegmentToggle
              groupLabel={i18n.themeGroup}
              value={theme}
              onChange={(id) => setTheme(id as "light" | "dark")}
              segments={[
                {
                  id: "light",
                  label: <SunIcon />,
                  ariaLabel: i18n.themeLight,
                  title: i18n.themeLight,
                },
                {
                  id: "dark",
                  label: <MoonIcon />,
                  ariaLabel: i18n.themeDark,
                  title: i18n.themeDark,
                },
              ]}
            />
            <HeaderSegmentToggle
              groupLabel={i18n.languageGroup}
              value={lang}
              onChange={(id) => setLang(id as "ko" | "en")}
              segments={[
                { id: "ko", label: "KR" },
                { id: "en", label: "EN" },
              ]}
            />
          </div>
        </div>
      </div>
    </header>
  );
};
