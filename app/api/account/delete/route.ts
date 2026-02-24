import { NextResponse } from "next/server";
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
      return NextResponse.json({ error: "Sesion invalida" }, { status: 401 });
    }

    const body = (await request.json().catch(() => ({}))) as { confirm?: string };
    if ((body.confirm || "").trim().toUpperCase() !== "ELIMINAR") {
      return NextResponse.json(
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

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "No se pudo eliminar la cuenta";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
