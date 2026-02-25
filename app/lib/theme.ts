export type AppTheme = "light" | "dark";

export function normalizeTheme(value: string | null | undefined): AppTheme | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  if (normalized === "light") return "light";
  if (normalized === "dark") return "dark";
  return null;
}

export function inferThemeFromBrowser() {
  if (typeof window === "undefined") return "light" as AppTheme;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}
