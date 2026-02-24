import { jsonUtf8, normalizeUtf8Text } from "../../../lib/api-utf8";
import { createClient as createServerSupabaseClient } from "../../../lib/supabase-server";
import { supabaseAdmin } from "../../../lib/supabase-admin";

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
    if (confirm !== "ELIMINAR") {
      return jsonUtf8(
        { error: 'Confirmacion invalida. Escribe "ELIMINAR" para continuar.' },
        { status: 400 }
      );
    }

    // Best-effort cleanup for profile row before auth deletion.
    await supabaseAdmin.from("profiles").delete().eq("id", user.id);

    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id, false);
    if (deleteError) {
      throw new Error(deleteError.message);
    }

    return jsonUtf8({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "No se pudo eliminar la cuenta";
    return jsonUtf8({ error: message }, { status: 500 });
  }
}
