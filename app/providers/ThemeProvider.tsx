"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { AppTheme, inferThemeFromBrowser } from "../lib/theme";

type ThemeContextValue = {
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;
};

const ThemeContext = createContext<ThemeContextValue>({
  theme: "light",
  setTheme: () => undefined,
});

function applyThemeToDom(theme: AppTheme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.remove("theme-light", "theme-dark");
  root.classList.add(theme === "dark" ? "theme-dark" : "theme-light");
  root.setAttribute("data-theme", theme);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<AppTheme>("light");
  const pathname = usePathname();

  const isPublicRoute = useMemo(() => {
    const path = (pathname || "/").toLowerCase();
    const normalized = path.replace(/^\/(en|es)(?=\/|$)/, "") || "/";
    const publicPrefixes = [
      "/",
      "/signin",
      "/signup",
      "/verify-email",
      "/privacy-policy",
      "/terms-and-conditions",
      "/data-deletion-policy",
    ];
    return publicPrefixes.some((prefix) =>
      prefix === "/" ? normalized === "/" : normalized.startsWith(prefix)
    );
  }, [pathname]);

  useEffect(() => {
    const nextTheme = inferThemeFromBrowser();
    setThemeState(nextTheme);
    applyThemeToDom(nextTheme);
  }, []);

  useEffect(() => {
    if (isPublicRoute) {
      applyThemeToDom("light");
      return;
    }
    applyThemeToDom(theme);
  }, [isPublicRoute, theme]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme: isPublicRoute ? "light" : theme,
      setTheme: (nextTheme) => {
        setThemeState(nextTheme);
        if (!isPublicRoute) {
          applyThemeToDom(nextTheme);
        }
      },
    }),
    [isPublicRoute, theme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
