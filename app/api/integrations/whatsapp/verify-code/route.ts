import { NextResponse } from "next/server";
import { createClient as createServerSupabaseClient } from "../../../../lib/supabase-server";
import { supabaseAdmin } from "../../../../lib/supabase-admin";
import { normalizeWhatsappNumber } from "../../../../lib/whatsapp";

type IntegrationRow = {
  whatsapp_number: string | null;
  whatsapp_verification_code: string | null;
  whatsapp_verification_expires_at: string | null;
  whatsapp_verification_attempts: number | null;
};

export async function POST(request: Request) {
  try {
    const supabaseServer = await createServerSupabaseClient();
    const {
      data: { user },
      error: userError,
    } = await supabaseServer.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ success: false, error: "Sesion invalida" }, { status: 401 });
    }

    const body = (await request.json().catch(() => ({}))) as { number?: string; code?: string };
    const number = normalizeWhatsappNumber(body.number || "");
    const code = (body.code || "").trim().toUpperCase();

    if (!number || !code || code.length !== 4) {
      return NextResponse.json({ success: false, error: "Codigo invalido" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("user_integrations")
      .select("whatsapp_number,whatsapp_verification_code,whatsapp_verification_expires_at,whatsapp_verification_attempts")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    const row = (data || null) as IntegrationRow | null;
    if (!row?.whatsapp_verification_code || !row.whatsapp_verification_expires_at) {
      return NextResponse.json({ success: false, error: "No hay verificacion pendiente" }, { status: 400 });
    }

    if (normalizeWhatsappNumber(row.whatsapp_number || "") !== number) {
      return NextResponse.json({ success: false, error: "El numero no coincide con la verificacion pendiente" }, { status: 400 });
    }

    const expired = new Date(row.whatsapp_verification_expires_at).getTime() < Date.now();
    if (expired) {
      return NextResponse.json({ success: false, error: "El codigo expiro. Solicita uno nuevo." }, { status: 400 });
    }

    if (row.whatsapp_verification_code.toUpperCase() !== code) {
      const attempts = Number(row.whatsapp_verification_attempts || 0) + 1;
      await supabaseAdmin
        .from("user_integrations")
        .update({
          whatsapp_verification_attempts: attempts,
          whatsapp_last_error: "Codigo incorrecto",
        })
        .eq("user_id", user.id);
      return NextResponse.json({ success: false, error: "Codigo incorrecto" }, { status: 400 });
    }

    const nowIso = new Date().toISOString();
    const { error: updateError } = await supabaseAdmin
      .from("user_integrations")
      .update({
        whatsapp_number: number,
        whatsapp_verified: true,
        whatsapp_verified_at: nowIso,
        whatsapp_verification_code: null,
        whatsapp_verification_expires_at: null,
        whatsapp_verification_attempts: 0,
        whatsapp_last_error: null,
      })
      .eq("user_id", user.id);

    if (updateError) {
      throw new Error(updateError.message);
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "No se pudo verificar el codigo";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
