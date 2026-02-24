import { createClient as createServerSupabaseClient } from "../../../../lib/supabase-server";
import { supabaseAdmin } from "../../../../lib/supabase-admin";
import { jsonUtf8 } from "../../../../lib/api-utf8";

const FACEBOOK_TABLES = [
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
] as const;

async function clearFacebookData(userId: string) {
  for (const table of FACEBOOK_TABLES) {
    const { error } = await supabaseAdmin.from(table).delete().eq("user_id", userId);
    if (error) throw new Error(error.message);
  }

  const { error: onboardingError } = await supabaseAdmin
    .from("user_onboarding")
    .update({ assets_connected: false })
    .eq("user_id", userId);

  if (onboardingError) throw new Error(onboardingError.message);
}

export async function POST() {
  try {
    const supabaseServer = await createServerSupabaseClient();
    const {
      data: { user },
      error,
    } = await supabaseServer.auth.getUser();

    if (error || !user) {
      return jsonUtf8({ error: "Sesion invalida" }, { status: 401 });
    }

    await clearFacebookData(user.id);
    return jsonUtf8({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "No se pudo desconectar Facebook";
    return jsonUtf8({ error: message }, { status: 500 });
  }
}
