"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  AppLocale,
  inferLocaleFromBrowser,
  LOCALE_COOKIE,
  TIMEZONE_COOKIE,
  normalizeLocale,
  readCookie,
  writeCookie,
} from "../lib/locale";

type LocaleContextValue = {
  locale: AppLocale;
  setLocale: (locale: AppLocale) => void;
};

const LocaleContext = createContext<LocaleContextValue>({
  locale: "en",
  setLocale: () => undefined,
});

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<AppLocale>("en");

  useEffect(() => {
    let resolved = normalizeLocale(readCookie(LOCALE_COOKIE));
    if (typeof navigator !== "undefined") {
      if (!resolved) {
        resolved = inferLocaleFromBrowser(
          navigator.language,
          Intl.DateTimeFormat().resolvedOptions().timeZone
        );
      }
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
      writeCookie(TIMEZONE_COOKIE, timezone);
    }

    const nextLocale = resolved || "en";
    setLocaleState(nextLocale);
    writeCookie(LOCALE_COOKIE, nextLocale);
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.lang = locale;
  }, [locale]);

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      setLocale: (nextLocale) => {
        setLocaleState(nextLocale);
        writeCookie(LOCALE_COOKIE, nextLocale);
        if (typeof navigator !== "undefined") {
          const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
          writeCookie(TIMEZONE_COOKIE, timezone);
        }
      },
    }),
    [locale]
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  return useContext(LocaleContext);
}
