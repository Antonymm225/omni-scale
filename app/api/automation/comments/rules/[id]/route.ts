import { NextRequest } from "next/server";
import { createClient as createServerSupabaseClient } from "../../../../../lib/supabase-server";
import { supabaseAdmin } from "../../../../../lib/supabase-admin";
import { jsonUtf8 } from "../../../../../lib/api-utf8";

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabaseServer = await createServerSupabaseClient();
    const {
      data: { user },
      error: userError,
    } = await supabaseServer.auth.getUser();
    if (userError || !user) return jsonUtf8({ error: "Sesion invalida" }, { status: 401 });

    const { id } = await params;
    const body = (await request.json()) as {
      is_active?: boolean;
      keyword?: string;
      reply_message?: string;
      send_dm?: boolean;
      dm_message?: string | null;
    };

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (typeof body.is_active === "boolean") updates.is_active = body.is_active;
    if (typeof body.keyword === "string" && body.keyword.trim()) {
      updates.keyword = body.keyword.trim();
      updates.keyword_normalized = normalizeText(body.keyword.trim());
    }
    if (typeof body.reply_message === "string" && body.reply_message.trim()) {
      updates.reply_message = body.reply_message.trim();
    }
    if (typeof body.send_dm === "boolean") updates.send_dm = body.send_dm;
    if (typeof body.dm_message === "string") updates.dm_message = body.dm_message.trim() || null;

    if (Object.keys(updates).length === 1) {
      return jsonUtf8({ error: "No hay campos para actualizar" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("comment_automation_rules")
      .update(updates)
      .eq("id", id)
      .eq("user_id", user.id)
      .select("id,facebook_page_id,keyword,reply_message,send_dm,dm_message,is_active,created_at")
      .single();
    if (error) throw new Error(error.message);

    return jsonUtf8({ ok: true, rule: data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "No se pudo actualizar la regla";
    return jsonUtf8({ error: message }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabaseServer = await createServerSupabaseClient();
    const {
      data: { user },
      error: userError,
    } = await supabaseServer.auth.getUser();
    if (userError || !user) return jsonUtf8({ error: "Sesion invalida" }, { status: 401 });

    const { id } = await params;
    const { error } = await supabaseAdmin
      .from("comment_automation_rules")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);
    if (error) throw new Error(error.message);

    return jsonUtf8({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "No se pudo eliminar la regla";
    return jsonUtf8({ error: message }, { status: 500 });
  }
}
