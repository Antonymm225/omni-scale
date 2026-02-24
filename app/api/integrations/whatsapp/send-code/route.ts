import { createClient as createServerSupabaseClient } from "../../../../lib/supabase-server";
import { supabaseAdmin } from "../../../../lib/supabase-admin";
import { generateVerificationCode, normalizeWhatsappNumber, sendWhatsappText } from "../../../../lib/whatsapp";
import { jsonUtf8, normalizeUtf8Text } from "../../../../lib/api-utf8";

export async function POST(request: Request) {
  try {
    const supabaseServer = await createServerSupabaseClient();
    const {
      data: { user },
      error: userError,
    } = await supabaseServer.auth.getUser();

    if (userError || !user) {
      return jsonUtf8({ success: false, error: "Sesion invalida" }, { status: 401 });
    }

    const body = (await request.json().catch(() => ({}))) as { number?: string };
    const rawNumber = normalizeUtf8Text(body.number || "") as string;
    const number = normalizeWhatsappNumber(rawNumber);

    if (!number || number.length < 8) {
      return jsonUtf8({ success: false, error: "Numero de WhatsApp invalido" }, { status: 400 });
    }

    const code = generateVerificationCode(4);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    const message = `👋 Hola, somos de OMNI Scale.\nEste es tu mensaje de verificacion.\nCodigo: *${code}*`;

    await sendWhatsappText({ number, message });

    const { error: upsertError } = await supabaseAdmin.from("user_integrations").upsert(
      {
        user_id: user.id,
        whatsapp_number: number,
        whatsapp_verified: false,
        whatsapp_verification_code: code,
        whatsapp_verification_expires_at: expiresAt,
        whatsapp_verification_attempts: 0,
        whatsapp_last_error: null,
      },
      { onConflict: "user_id" }
    );

    if (upsertError) {
      throw new Error(upsertError.message);
    }

    return jsonUtf8({ success: true, expires_at: expiresAt });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error enviando mensaje";
    return jsonUtf8({ success: false, error: message }, { status: 500 });
  }
}
