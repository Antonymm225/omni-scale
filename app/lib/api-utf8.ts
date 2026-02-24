import { NextResponse } from "next/server";

export function jsonUtf8(body: unknown, init?: ResponseInit) {
  const headers = new Headers(init?.headers);
  headers.set("Content-Type", "application/json; charset=utf-8");
  return new NextResponse(JSON.stringify(body), {
    ...init,
    headers,
  });
}

export function normalizeUtf8Text(value: unknown) {
  if (typeof value !== "string") return value;
  return value.normalize("NFC");
}
