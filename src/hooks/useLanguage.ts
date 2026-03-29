import { createContext, useContext, useState, useEffect } from "react";
import { Lang, createT, TranslationKey } from "@/lib/i18n";

interface LanguageContextValue {
  lang:    Lang;
  setLang: (l: Lang) => void;
  t:       (key: TranslationKey) => string;
}

export const LanguageContext = createContext<LanguageContextValue>({
  lang:    "es",
  setLang: () => {},
  t:       createT("es"),
});

export function useLanguage() {
  return useContext(LanguageContext);
}

export function useLanguageState(): LanguageContextValue {
  const stored = (): Lang => {
    try { return (localStorage.getItem("lang") as Lang) || "es"; }
    catch { return "es"; }
  };
  const [lang, setLangState] = useState<Lang>(stored);

  const setLang = (l: Lang) => {
    setLangState(l);
    try { localStorage.setItem("lang", l); } catch {}
  };

  // Expose t as a stable function that re-derives whenever lang changes
  const t = createT(lang);

  return { lang, setLang, t };
}
