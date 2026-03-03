import { NextRequest } from "next/server";
import { createClient as createServerSupabaseClient } from "../../../../lib/supabase-server";
import { supabaseAdmin } from "../../../../lib/supabase-admin";
import { jsonUtf8 } from "../../../../lib/api-utf8";

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export async function GET() {
  try {
    const supabaseServer = await createServerSupabaseClient();
    const {
      data: { user },
      error: userError,
    } = await supabaseServer.auth.getUser();
    if (userError || !user) return jsonUtf8({ error: "Sesion invalida" }, { status: 401 });

    const [
      { data: rules, error: rulesError },
      { data: pages, error: pagesError },
      { data: events, error: eventsError },
    ] = await Promise.all([
      supabaseAdmin
        .from("comment_automation_rules")
        .select("id,facebook_page_id,keyword,reply_message,send_dm,dm_message,is_active,created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
      supabaseAdmin
        .from("facebook_pages")
        .select("facebook_page_id,name")
        .eq("user_id", user.id)
        .order("name", { ascending: true }),
      supabaseAdmin
        .from("comment_automation_events")
        .select(
          "id,rule_id,facebook_page_id,facebook_comment_id,comment_message,matched_keyword,public_reply_sent,dm_sent,dm_error,processed_at"
        )
        .eq("user_id", user.id)
        .order("processed_at", { ascending: false })
        .limit(50),
    ]);

    if (rulesError) throw new Error(rulesError.message);
    if (pagesError) throw new Error(pagesError.message);
    if (eventsError) throw new Error(eventsError.message);

    return jsonUtf8({ rules: rules || [], pages: pages || [], events: events || [] });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "No se pudo cargar reglas";
    return jsonUtf8({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabaseServer = await createServerSupabaseClient();
    const {
      data: { user },
      error: userError,
    } = await supabaseServer.auth.getUser();
    if (userError || !user) return jsonUtf8({ error: "Sesion invalida" }, { status: 401 });

    const body = (await request.json()) as {
      facebook_page_id?: string;
      keyword?: string;
      reply_message?: string;
    };

    const pageId = (body.facebook_page_id || "").trim();
    const keyword = (body.keyword || "").trim();
    const replyMessage = (body.reply_message || "").trim();
    const sendDm = false;
    const dmMessage = "";

    if (!pageId || !keyword || !replyMessage) {
      return jsonUtf8({ error: "facebook_page_id, keyword y reply_message son requeridos" }, { status: 400 });
    }
    const { data: page, error: pageError } = await supabaseAdmin
      .from("facebook_pages")
      .select("facebook_page_id")
      .eq("user_id", user.id)
      .eq("facebook_page_id", pageId)
      .maybeSingle();
    if (pageError) throw new Error(pageError.message);
    if (!page) return jsonUtf8({ error: "La pagina no pertenece al usuario" }, { status: 400 });

    const nowIso = new Date().toISOString();
    const { data, error } = await supabaseAdmin
      .from("comment_automation_rules")
      .insert({
        user_id: user.id,
        facebook_page_id: pageId,
        keyword,
        keyword_normalized: normalizeText(keyword),
        reply_message: replyMessage,
        send_dm: sendDm,
        dm_message: sendDm ? dmMessage : null,
        is_active: true,
        created_at: nowIso,
        updated_at: nowIso,
      })
      .select("id,facebook_page_id,keyword,reply_message,send_dm,dm_message,is_active,created_at")
      .single();
    if (error) throw new Error(error.message);

    return jsonUtf8({ ok: true, rule: data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "No se pudo crear la regla";
    return jsonUtf8({ error: message }, { status: 500 });
  }
}
