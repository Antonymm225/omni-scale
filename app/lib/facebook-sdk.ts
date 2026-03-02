import bizSdk from "facebook-nodejs-business-sdk";

type CursorLike<T> = Array<T> & {
  hasNext?: () => boolean;
  next?: () => Promise<CursorLike<T>>;
};

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};
}

export function initFacebookApi(accessToken: string) {
  return bizSdk.FacebookAdsApi.init(accessToken);
}

export function getFacebookSdk() {
  return bizSdk;
}

export function normalizeAdAccountEdgeId(facebookAdAccountId: string, accountId: string | null): string {
  if (facebookAdAccountId.startsWith("act_")) return facebookAdAccountId;
  return `act_${accountId || facebookAdAccountId}`;
}

export async function readAllCursorPages<T>(
  firstPage: Promise<CursorLike<T>>,
  options?: { maxPages?: number; maxItems?: number }
): Promise<T[]> {
  const maxPages = options?.maxPages ?? 20;
  const maxItems = options?.maxItems ?? 5000;

  const rows: T[] = [];
  let cursor = await firstPage;
  let page = 0;

  while (cursor && page < maxPages) {
    rows.push(...cursor);
    if (rows.length >= maxItems) break;
    if (!cursor.hasNext || !cursor.next || !cursor.hasNext()) break;
    cursor = await cursor.next();
    page += 1;
  }

  return rows.slice(0, maxItems);
}

export function readFacebookError(error: unknown, fallback = "Facebook request failed"): string {
  if (error instanceof Error && error.message) return error.message;

  const asAny = asRecord(error);
  const response = asRecord(asAny.response);
  const data = asRecord(response.body || response.data || asAny.body || asAny.data);
  const payloadError = asRecord(data.error || asAny.error);
  const userTitle = typeof payloadError.error_user_title === "string" ? payloadError.error_user_title : "";
  const userMessage = typeof payloadError.error_user_msg === "string" ? payloadError.error_user_msg : "";
  const message =
    typeof payloadError.message === "string"
      ? payloadError.message
      : typeof asAny.message === "string"
        ? asAny.message
        : fallback;

  if (userTitle) return `${userTitle}: ${userMessage || message}`;
  return message;
}

