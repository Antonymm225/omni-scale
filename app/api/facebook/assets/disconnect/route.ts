import { NextResponse } from "next/server";
import { createClient as createServerSupabaseClient } from "../../../../lib/supabase-server";
import { supabaseAdmin } from "../../../../lib/supabase-admin";

const FACEBOOK_TABLES = [
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
      return NextResponse.json({ error: "Sesion invalida" }, { status: 401 });
    }

    await clearFacebookData(user.id);
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "No se pudo desconectar Facebook";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
