import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerSupabaseClient } from "../../../../lib/supabase-server";
import { supabaseAdmin } from "../../../../lib/supabase-admin";
import {
  syncUserAllMetrics,
  syncUserLeadsMetrics,
  syncUserPerformanceMonitoring,
} from "../../../../lib/facebook-metrics";

export async function POST(request: NextRequest) {
  try {
    const supabaseServer = await createServerSupabaseClient();
    const {
      data: { user },
      error: userError,
    } = await supabaseServer.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Sesion invalida" }, { status: 401 });
    }

    const { data: connection, error: connectionError } = await supabaseAdmin
      .from("facebook_connections")
      .select("access_token")
      .eq("user_id", user.id)
      .maybeSingle();

    if (connectionError) {
      return NextResponse.json({ error: connectionError.message }, { status: 500 });
    }

    if (!connection?.access_token) {
      return NextResponse.json({ error: "No hay conexion activa con Facebook" }, { status: 400 });
    }

    const scope = request.nextUrl.searchParams.get("scope");
    if (scope === "leads") {
      const leadsSummary = await syncUserLeadsMetrics(user.id, connection.access_token);
      const monitoringSummary = await syncUserPerformanceMonitoring(user.id, connection.access_token);
      return NextResponse.json({
        ok: true,
        scope: "leads",
        summary: { leads: leadsSummary, monitoring: monitoringSummary },
      });
    }

    const summary = await syncUserAllMetrics(user.id, connection.access_token);
    return NextResponse.json({ ok: true, scope: "all", summary });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "No se pudo sincronizar";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
