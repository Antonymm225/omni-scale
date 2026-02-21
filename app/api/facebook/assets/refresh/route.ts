import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerSupabaseClient } from "../../../../lib/supabase-server";
import { supabaseAdmin } from "../../../../lib/supabase-admin";

const FACEBOOK_TABLES = [
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

function getBaseUrl(origin: string) {
  return process.env.NEXT_PUBLIC_SITE_URL || origin;
}

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

export async function GET(request: NextRequest) {
  const baseUrl = getBaseUrl(request.nextUrl.origin);

  try {
    const supabaseServer = await createServerSupabaseClient();
    const {
      data: { user },
      error,
    } = await supabaseServer.auth.getUser();

    if (error || !user) {
      return NextResponse.redirect(`${baseUrl}/signin`);
    }

    await clearFacebookData(user.id);
    return NextResponse.redirect(`${baseUrl}/api/facebook/oauth/start`);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "No se pudo refrescar la conexion";
    return NextResponse.redirect(
      `${baseUrl}/assets/facebook-conexion?status=error&message=${encodeURIComponent(message)}`
    );
  }
}
