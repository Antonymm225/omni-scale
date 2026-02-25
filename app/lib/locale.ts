export const LOCALE_COOKIE = "omni_locale";
export const TIMEZONE_COOKIE = "omni_timezone";

export type AppLocale = "es" | "en";

export const SUPPORTED_LOCALES: AppLocale[] = ["es", "en"];

const SPANISH_COUNTRIES = new Set([
  "AR",
  "BO",
  "CL",
  "CO",
  "CR",
  "CU",
  "DO",
  "EC",
  "ES",
  "GQ",
  "GT",
  "HN",
  "MX",
  "NI",
  "PA",
  "PE",
  "PR",
  "PY",
  "SV",
  "UY",
  "VE",
]);

export function normalizeLocale(value: string | null | undefined): AppLocale | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  if (normalized === "es") return "es";
  if (normalized === "en") return "en";
  return null;
}

export function localePrefix(locale: AppLocale) {
  return locale.toUpperCase();
}

export function localizePublicPath(locale: AppLocale, path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  if (normalizedPath === "/") return `/${localePrefix(locale)}`;
  return `/${localePrefix(locale)}${normalizedPath}`;
}

export function readCookie(name: string) {
  if (typeof document === "undefined") return null;
  const prefix = `${name}=`;
  const match = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(prefix));
  if (!match) return null;
  return decodeURIComponent(match.slice(prefix.length));
}

export function writeCookie(name: string, value: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=${encodeURIComponent(
    value
  )}; path=/; max-age=31536000; SameSite=Lax`;
}

export function inferLocaleFromCountry(countryCode: string | null | undefined): AppLocale {
  if (!countryCode) return "en";
  return SPANISH_COUNTRIES.has(countryCode.toUpperCase()) ? "es" : "en";
}

export function inferLocaleFromLanguageHeader(acceptLanguage: string | null | undefined): AppLocale {
  if (!acceptLanguage) return "en";
  const first = acceptLanguage.split(",")[0]?.trim() || "";
  if (!first) return "en";
  const language = first.toLowerCase();
  if (language.startsWith("es")) return "es";
  return "en";
}

export function inferLocaleFromBrowser(navigatorLanguage: string | undefined, timezone: string | undefined): AppLocale {
  const normalizedLang = (navigatorLanguage || "").toLowerCase();
  if (normalizedLang.startsWith("es")) return "es";
  if (normalizedLang.startsWith("en")) return "en";

  const normalizedTz = (timezone || "").toLowerCase();
  if (normalizedTz.includes("lima") || normalizedTz.includes("mexico") || normalizedTz.includes("buenos_aires")) {
    return "es";
  }

  return "en";
}
