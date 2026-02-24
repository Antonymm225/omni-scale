"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { AppTheme, inferThemeFromBrowser, normalizeTheme, THEME_COOKIE } from "../lib/theme";

type ThemeContextValue = {
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;
};

const ThemeContext = createContext<ThemeContextValue>({
  theme: "light",
  setTheme: () => undefined,
});

function readCookieTheme() {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(`${THEME_COOKIE}=`))
    ?.split("=")[1];
  return normalizeTheme(match);
}

function applyThemeToDom(theme: AppTheme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.remove("theme-light", "theme-dark");
  root.classList.add(theme === "dark" ? "theme-dark" : "theme-light");
  root.setAttribute("data-theme", theme);
}

function persistTheme(theme: AppTheme) {
  if (typeof document === "undefined") return;
  document.cookie = `${THEME_COOKIE}=${theme}; path=/; max-age=31536000; SameSite=Lax`;
  try {
    localStorage.setItem(THEME_COOKIE, theme);
  } catch {
    // Ignore localStorage errors
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<AppTheme>("light");

  useEffect(() => {
    let resolved = readCookieTheme();

    if (!resolved && typeof window !== "undefined") {
      try {
        resolved = normalizeTheme(localStorage.getItem(THEME_COOKIE));
      } catch {
        resolved = null;
      }
    }

    const nextTheme = resolved || inferThemeFromBrowser();
    setThemeState(nextTheme);
    persistTheme(nextTheme);
    applyThemeToDom(nextTheme);
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      setTheme: (nextTheme) => {
        setThemeState(nextTheme);
        persistTheme(nextTheme);
        applyThemeToDom(nextTheme);
      },
    }),
    [theme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
