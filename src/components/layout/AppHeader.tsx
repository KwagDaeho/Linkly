import { MoonIcon, SunIcon } from "@/components/icons";
import {
  FONT_SCALE_MAX,
  FONT_SCALE_MIN,
} from "@/constants/fontScale";
import { usePrefs } from "@/hooks";
import { cx } from "@/utils/cx";

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
            <button
              type="button"
              data-font-scale-btn=""
              className={cx(
                styles.fontScaleButton,
                fontScale <= FONT_SCALE_MIN && styles.fontScaleButtonDisabled,
              )}
              aria-label={i18n.fontSizeDecrease}
              title={i18n.fontSizeDecrease}
              disabled={fontScale <= FONT_SCALE_MIN}
              onClick={decreaseFontScale}
            >
              −
            </button>
            <span className={styles.fontScaleValue} aria-live="polite">
              {fontScale}%
            </span>
            <button
              type="button"
              data-font-scale-btn=""
              className={cx(
                styles.fontScaleButton,
                fontScale >= FONT_SCALE_MAX && styles.fontScaleButtonDisabled,
              )}
              aria-label={i18n.fontSizeIncrease}
              title={i18n.fontSizeIncrease}
              disabled={fontScale >= FONT_SCALE_MAX}
              onClick={increaseFontScale}
            >
              +
            </button>
          </div>
          <div className={styles.toolbarRow}>
            <HeaderSegmentToggle
              groupLabel="Theme"
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
              groupLabel="Language"
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
