import { jsonUtf8, normalizeUtf8Text } from "../../../lib/api-utf8";
import { createClient as createServerSupabaseClient } from "../../../lib/supabase-server";
import { supabaseAdmin } from "../../../lib/supabase-admin";

const USER_TABLES = [
  "user_whatsapp_alert_events",
  "facebook_ai_runs",
  "facebook_sales_timeseries",
  "facebook_sales_ad_account_metrics",
  "facebook_sales_metrics",
  "facebook_performance_snapshots",
  "facebook_performance_state",
  "facebook_performance_monitors",
  "facebook_branding_timeseries",
  "facebook_branding_ad_account_metrics",
  "facebook_branding_metrics",
  "facebook_leads_timeseries",
  "facebook_leads_ad_account_metrics",
  "facebook_leads_metrics",
  "facebook_messages_timeseries",
  "facebook_messages_ad_account_metrics",
  "facebook_messages_metrics",
  "facebook_dashboard_timeseries",
  "facebook_dashboard_ad_account_metrics",
  "facebook_dashboard_metrics",
  "facebook_adsets",
  "facebook_pixels",
  "facebook_instagram_accounts",
  "facebook_pages",
  "facebook_ad_accounts",
  "facebook_business_managers",
  "facebook_connections",
  "user_integrations",
  "user_onboarding",
] as const;

export async function POST(request: Request) {
  try {
    const supabaseServer = await createServerSupabaseClient();
    const {
      data: { user },
      error: userError,
    } = await supabaseServer.auth.getUser();

    if (userError || !user) {
      return jsonUtf8({ error: "Sesion invalida" }, { status: 401 });
    }

    const body = (await request.json().catch(() => ({}))) as { confirm?: string };
    const confirm = ((normalizeUtf8Text(body.confirm || "") as string) || "").trim().toUpperCase();
    if (confirm !== "BORRAR") {
      return jsonUtf8(
        { error: "Confirmacion invalida. Escribe BORRAR para continuar." },
        { status: 400 }
      );
    }

    for (const table of USER_TABLES) {
      const { error } = await supabaseAdmin.from(table).delete().eq("user_id", user.id);
      if (error) {
        throw new Error(`[${table}] ${error.message}`);
      }
    }

    return jsonUtf8({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "No se pudo borrar la data";
    return jsonUtf8({ error: message }, { status: 500 });
  }
}
