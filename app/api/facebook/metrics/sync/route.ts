import { NextRequest } from "next/server";
import { createClient as createServerSupabaseClient } from "../../../../lib/supabase-server";
import { supabaseAdmin } from "../../../../lib/supabase-admin";
import {
  runUserMetricsSyncWithRuntime,
} from "../../../../lib/facebook-metrics";
import { jsonUtf8 } from "../../../../lib/api-utf8";

export async function POST(request: NextRequest) {
  try {
    const supabaseServer = await createServerSupabaseClient();
    const {
      data: { user },
      error: userError,
    } = await supabaseServer.auth.getUser();

    if (userError || !user) {
      return jsonUtf8({ error: "Sesion invalida" }, { status: 401 });
    }

    const { data: connection, error: connectionError } = await supabaseAdmin
      .from("facebook_connections")
      .select("access_token")
      .eq("user_id", user.id)
      .maybeSingle();

    if (connectionError) {
      return jsonUtf8({ error: connectionError.message }, { status: 500 });
    }

    if (!connection?.access_token) {
      return jsonUtf8({ error: "No hay conexion activa con Facebook" }, { status: 400 });
    }

    const scope = request.nextUrl.searchParams.get("scope");
    if (scope === "leads") {
      const run = await runUserMetricsSyncWithRuntime({
        userId: user.id,
        token: connection.access_token,
        triggerSource: "manual",
        scope: "leads",
      });
      if (run.status === "locked") {
        return jsonUtf8({ ok: false, locked: true, error: "Sincronizacion en curso. Intenta en unos minutos." }, { status: 409 });
      }
      return jsonUtf8({
        ok: true,
        scope: "leads",
        summary: run.summary,
        run_id: run.runId,
      });
    }

    const run = await runUserMetricsSyncWithRuntime({
      userId: user.id,
      token: connection.access_token,
      triggerSource: "manual",
      scope: "all",
    });
    if (run.status === "locked") {
      return jsonUtf8({ ok: false, locked: true, error: "Sincronizacion en curso. Intenta en unos minutos." }, { status: 409 });
    }
    return jsonUtf8({ ok: true, scope: "all", summary: run.summary, run_id: run.runId });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "No se pudo sincronizar";
    return jsonUtf8({ error: message }, { status: 500 });
  }
}
