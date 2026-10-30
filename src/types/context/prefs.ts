import type { Dict, Lang } from "../i18n";
import type { Theme } from "../ui";

export type PrefsContextValue = {
  lang: Lang;
  setLang: (next: Lang) => void;
  theme: Theme;
  setTheme: (next: Theme) => void;
  fontScale: number;
  setFontScale: (next: number) => void;
  decreaseFontScale: () => void;
  increaseFontScale: () => void;
  i18n: Dict;
};
