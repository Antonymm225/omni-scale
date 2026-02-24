"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { AppLocale, inferLocaleFromBrowser, LOCALE_COOKIE, normalizeLocale } from "../lib/locale";

type LocaleContextValue = {
  locale: AppLocale;
  setLocale: (locale: AppLocale) => void;
};

const LocaleContext = createContext<LocaleContextValue>({
  locale: "en",
  setLocale: () => undefined,
});

function readCookieLocale() {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(`${LOCALE_COOKIE}=`))
    ?.split("=")[1];
  return normalizeLocale(match);
}

function persistLocale(locale: AppLocale) {
  if (typeof document === "undefined") return;
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=31536000; SameSite=Lax`;
  try {
    localStorage.setItem(LOCALE_COOKIE, locale);
  } catch {
    // Ignore localStorage errors (private mode, etc.)
  }
}

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<AppLocale>("en");

  useEffect(() => {
    let resolved = readCookieLocale();

    if (!resolved && typeof window !== "undefined") {
      try {
        resolved = normalizeLocale(localStorage.getItem(LOCALE_COOKIE));
      } catch {
        resolved = null;
      }
    }

    if (!resolved && typeof navigator !== "undefined") {
      resolved = inferLocaleFromBrowser(
        navigator.language,
        Intl.DateTimeFormat().resolvedOptions().timeZone
      );
    }

    const nextLocale = resolved || "en";
    setLocaleState(nextLocale);
    persistLocale(nextLocale);
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
        persistLocale(nextLocale);
      },
    }),
    [locale]
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  return useContext(LocaleContext);
}
