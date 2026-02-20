import { NextRequest, NextResponse } from "next/server";
import { syncAllDashboardMetrics } from "../../../lib/facebook-metrics";

function isAuthorized(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return true;

  const header = request.headers.get("authorization") || "";
  return header === `Bearer ${cronSecret}`;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const summary = await syncAllDashboardMetrics();
    return NextResponse.json({ ok: true, ...summary });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Metrics sync failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
