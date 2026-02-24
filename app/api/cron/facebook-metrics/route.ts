import { NextRequest } from "next/server";
import { syncAllDashboardMetrics } from "../../../lib/facebook-metrics";
import { jsonUtf8 } from "../../../lib/api-utf8";

function isAuthorized(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return true;

  const header = request.headers.get("authorization") || "";
  return header === `Bearer ${cronSecret}`;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return jsonUtf8({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const summary = await syncAllDashboardMetrics();
    return jsonUtf8({ ok: true, ...summary });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Metrics sync failed";
    return jsonUtf8({ error: message }, { status: 500 });
  }
}
