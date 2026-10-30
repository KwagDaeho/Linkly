import { MoonIcon, SunIcon } from "@/components/icons";
import {
  FONT_SCALE_MAX,
  FONT_SCALE_MIN,
} from "@/constants/fontScale";
import { usePrefs } from "@/hooks";
import { cx } from "@/utils/cx";

import { AppBrandTitle } from "./AppBrandTitle";
import * as styles from "./AppHeader.css";

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
          <div className={styles.themeToggle} role="group" aria-label="Theme">
            <button
              type="button"
              className={cx(
                styles.themeButton,
                theme === "light" && styles.themeButtonActive,
              )}
              aria-label={i18n.themeLight}
              title={i18n.themeLight}
              onClick={() => setTheme("light")}
            >
              <SunIcon />
            </button>
            <button
              type="button"
              className={cx(
                styles.themeButton,
                theme === "dark" && styles.themeButtonActive,
              )}
              aria-label={i18n.themeDark}
              title={i18n.themeDark}
              onClick={() => setTheme("dark")}
            >
              <MoonIcon />
            </button>
          </div>
          <div className={styles.langSwitch} role="group" aria-label="Language">
            <button
              type="button"
              className={cx(
                styles.langButton,
                lang === "ko" && styles.langButtonActive,
              )}
              onClick={() => setLang("ko")}
            >
              KR
            </button>
            <button
              type="button"
              className={cx(
                styles.langButton,
                lang === "en" && styles.langButtonActive,
              )}
              onClick={() => setLang("en")}
            >
              EN
            </button>
          </div>
          </div>
        </div>
      </div>
    </header>
  );
};
