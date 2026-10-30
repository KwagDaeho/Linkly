import { createContext, useContext, useEffect, useState } from "react";
import { FONT_SCALE_STEP } from "@/constants/fontScale";
import { FONT_SCALE_KEY, LANG_KEY, THEME_KEY } from "@/constants/storage";
import { t } from "@/i18n";
import {
  applyFontScale,
  applyTheme,
  clampFontScale,
  loadFontScale,
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
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);
  useEffect(() => {
    applyFontScale(fontScale);
  }, [fontScale]);
  const setLang = (next: Lang) => {
    setLangState(next);
    localStorage.setItem(LANG_KEY, next);
  };
  const setTheme = (next: Theme) => {
    setThemeState(next);
    localStorage.setItem(THEME_KEY, next);
    applyTheme(next);
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
    fontScale,
    setFontScale,
    decreaseFontScale,
    increaseFontScale,
    i18n: t(lang),
  };
};
