import { NextRequest, NextResponse } from "next/server";
import {
  inferLocaleFromCountry,
  inferLocaleFromLanguageHeader,
  LOCALE_COOKIE,
  normalizeLocale,
} from "./app/lib/locale";

const PUBLIC_LOCALIZED_ROUTES = new Set([
  "/",
  "/signin",
  "/signup",
  "/verify-email",
  "/privacy-policy",
  "/terms-and-conditions",
  "/data-deletion-policy",
]);

function isStaticOrApi(pathname: string) {
  return (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/public") ||
    pathname.includes(".")
  );
}

function detectLocale(request: NextRequest) {
  const cookieLocale = normalizeLocale(request.cookies.get(LOCALE_COOKIE)?.value);
  if (cookieLocale) return cookieLocale;

  const countryLocale = inferLocaleFromCountry(request.headers.get("x-vercel-ip-country"));
  if (countryLocale) return countryLocale;

  return inferLocaleFromLanguageHeader(request.headers.get("accept-language"));
}

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (isStaticOrApi(pathname)) return NextResponse.next();

  const localeMatch = pathname.match(/^\/(en|es)(\/.*)?$/i);
  if (localeMatch) {
    const locale = normalizeLocale(localeMatch[1]) || "en";
    const rest = localeMatch[2] || "/";
    const destination = new URL(rest || "/", request.url);
    destination.search = search;
    const response = NextResponse.rewrite(destination);
    response.cookies.set(LOCALE_COOKIE, locale, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
    return response;
  }

  if (PUBLIC_LOCALIZED_ROUTES.has(pathname)) {
    const locale = detectLocale(request);
    const destination = new URL(
      pathname === "/" ? `/${locale.toUpperCase()}` : `/${locale.toUpperCase()}${pathname}`,
      request.url
    );
    destination.search = search;
    const response = NextResponse.redirect(destination);
    response.cookies.set(LOCALE_COOKIE, locale, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
