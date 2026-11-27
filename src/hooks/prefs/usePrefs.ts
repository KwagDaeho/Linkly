import { createContext, useContext, useEffect, useState } from "react";
import { FONT_SCALE_STEP } from "@/constants/fontScale";
import { ACCENT_COLOR_KEY, FONT_SCALE_KEY, LANG_KEY, THEME_KEY } from "@/constants/storage";
import { hexToRgb, normalizeHex, rgbToInt } from "@/domain/color/color";
import { syncNativeAccent } from "@/services/tauri";
import { t } from "@/i18n";
import {
  applyAccent,
  applyFontScale,
  applyTheme,
  clampFontScale,
  loadFontScale,
  loadAccent,
  loadLang,
  loadTheme,
} from "@/utils/theme";
import type { Lang, PrefsContextValue, Theme } from "@/types";
export const PrefsContext = createContext<PrefsContextValue | null>(null);
export const usePrefs = (): PrefsContextValue => {
  const context = useContext(PrefsContext);
  if (context === null) {
    throw new Error("usePrefs must be used within PrefsProvider");
  }
  return context;
};
export const usePrefsState = (): PrefsContextValue => {
  const [lang, setLangState] = useState<Lang>(() => loadLang());
  const [theme, setThemeState] = useState<Theme>(() => loadTheme());
  const [fontScale, setFontScaleState] = useState(() => loadFontScale());
  const [accentColor, setAccentColorState] = useState(() => loadAccent());
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);
  useEffect(() => {
    applyFontScale(fontScale);
  }, [fontScale]);
  useEffect(() => {
    applyAccent(accentColor);
    void syncNativeAccent(rgbToInt(hexToRgb(accentColor))).catch(() => undefined);
  }, [accentColor]);
  const setLang = (next: Lang) => {
    setLangState(next);
    localStorage.setItem(LANG_KEY, next);
  };
  const setTheme = (next: Theme) => {
    setThemeState(next);
    localStorage.setItem(THEME_KEY, next);
    applyTheme(next);
  };
  const setAccentColor = (next: string) => {
    const hex = normalizeHex(next);
    if (hex === null) {
      return;
    }
    setAccentColorState(hex);
    localStorage.setItem(ACCENT_COLOR_KEY, hex);
  };
  const setFontScale = (next: number) => {
    const clamped = clampFontScale(next);
    setFontScaleState(clamped);
    localStorage.setItem(FONT_SCALE_KEY, String(clamped));
    applyFontScale(clamped);
  };
  const decreaseFontScale = () => {
    setFontScale(fontScale - FONT_SCALE_STEP);
  };
  const increaseFontScale = () => {
    setFontScale(fontScale + FONT_SCALE_STEP);
  };
  return {
    lang,
    setLang,
    theme,
    setTheme,
    accentColor,
    setAccentColor,
    fontScale,
    setFontScale,
    decreaseFontScale,
    increaseFontScale,
    i18n: t(lang),
  };
};
