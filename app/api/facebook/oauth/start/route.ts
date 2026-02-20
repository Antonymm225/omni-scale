import { NextResponse } from "next/server";

function normalizeBaseUrl(rawUrl: string) {
  const trimmed = rawUrl.trim().replace(/\/+$/, "");

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return trimmed;
  }

  if (
    process.env.NODE_ENV === "production" &&
    parsed.protocol !== "https:"
  ) {
    parsed.protocol = "https:";
  }

  if (parsed.hostname === "www.omniscale.pe") {
    parsed.hostname = "omniscale.pe";
  }

  return parsed.toString().replace(/\/+$/, "");
}

export async function GET(request: Request) {
  const appId = process.env.FACEBOOK_APP_ID;
  const origin = new URL(request.url).origin;
  const baseUrl = normalizeBaseUrl(
    process.env.NEXT_PUBLIC_SITE_URL || origin
  );

  if (!appId) {
    return NextResponse.redirect(
      `${baseUrl}/setup/connect-assets?status=error&message=Falta+FACEBOOK_APP_ID`
    );
  }

  const state = crypto.randomUUID();
  const redirectUri = `${baseUrl}/api/facebook/oauth/callback`;
  const scopes = [
    "ads_management",
    "ads_read",
    "business_management",
    "pages_read_engagement",
  ].join(",");

  const facebookAuthUrl = new URL("https://www.facebook.com/v23.0/dialog/oauth");
  facebookAuthUrl.searchParams.set("client_id", appId);
  facebookAuthUrl.searchParams.set("redirect_uri", redirectUri);
  facebookAuthUrl.searchParams.set("response_type", "code");
  facebookAuthUrl.searchParams.set("scope", scopes);
  facebookAuthUrl.searchParams.set("state", state);

  const response = NextResponse.redirect(facebookAuthUrl.toString());
  response.cookies.set("fb_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 10,
    path: "/",
  });
  response.cookies.set("fb_oauth_redirect_uri", redirectUri, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 10,
    path: "/",
  });

  return response;
}
