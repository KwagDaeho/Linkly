import { createContext, useContext, useEffect, useState } from "react";
import { FONT_SCALE_STEP } from "@/constants/fontScale";
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
  saveAccent,
  saveFontScale,
  saveLang,
  saveTheme,
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
    saveLang(next);
  };
  const setTheme = (next: Theme) => {
    setThemeState(next);
    saveTheme(next);
    applyTheme(next);
  };
  const setAccentColor = (next: string) => {
    const hex = normalizeHex(next);
    if (hex === null) {
      return;
    }
    setAccentColorState(hex);
    saveAccent(hex);
  };
  const setFontScale = (next: number) => {
    const clamped = clampFontScale(next);
    setFontScaleState(clamped);
    saveFontScale(clamped);
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
