import { NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  const hostname = request.nextUrl.hostname;

  if (process.env.NODE_ENV === "production" && hostname === "www.omniscale.pe") {
    const url = request.nextUrl.clone();
    url.hostname = "omniscale.pe";
    url.protocol = "https:";
    return NextResponse.redirect(url, 301);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

