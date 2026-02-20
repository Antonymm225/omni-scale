import { NextResponse } from "next/server";
import { createClient as createServerSupabaseClient } from "../../../../lib/supabase-server";
import { supabaseAdmin } from "../../../../lib/supabase-admin";
import { syncUserDashboardMetrics } from "../../../../lib/facebook-metrics";

export async function POST() {
  try {
    const supabaseServer = await createServerSupabaseClient();
    const {
      data: { user },
      error: userError,
    } = await supabaseServer.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Sesión inválida" }, { status: 401 });
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
      return NextResponse.json({ error: "No hay conexión activa con Facebook" }, { status: 400 });
    }

    const summary = await syncUserDashboardMetrics(user.id, connection.access_token);
    return NextResponse.json({ ok: true, summary });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "No se pudo sincronizar";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
