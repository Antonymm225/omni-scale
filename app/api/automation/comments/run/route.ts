import { createClient as createServerSupabaseClient } from "../../../../lib/supabase-server";
import { jsonUtf8 } from "../../../../lib/api-utf8";
import { runCommentAutomationForUser } from "../../../../lib/facebook-comment-automation";

export async function POST() {
  try {
    const supabaseServer = await createServerSupabaseClient();
    const {
      data: { user },
      error: userError,
    } = await supabaseServer.auth.getUser();
    if (userError || !user) return jsonUtf8({ error: "Sesion invalida" }, { status: 401 });

    const summary = await runCommentAutomationForUser(user.id);
    return jsonUtf8({ ok: true, summary });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "No se pudo ejecutar la automatizacion";
    return jsonUtf8({ error: message }, { status: 500 });
  }
}
