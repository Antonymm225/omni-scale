import { NextRequest } from "next/server";
import { createClient as createServerSupabaseClient } from "../../../lib/supabase-server";
import { supabaseAdmin } from "../../../lib/supabase-admin";
import { jsonUtf8 } from "../../../lib/api-utf8";

const GRAPH_BASE_URL = "https://graph.facebook.com/v23.0";

type PublishBody = {
  strategyId?: string;
  targetAdAccountId?: string;
  targetPageId?: string | null;
  targetWhatsappNumber?: string | null;
  templateVariables?: Record<string, string>;
};

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};
}

function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function readGraphError(payload: unknown): string {
  const error = asRecord(payload).error;
  const errorRecord = asRecord(error);
  const userTitle = typeof errorRecord.error_user_title === "string" ? errorRecord.error_user_title : "";
  const userMessage = typeof errorRecord.error_user_msg === "string" ? errorRecord.error_user_msg : "";
  const message = typeof errorRecord.message === "string" ? errorRecord.message : "Facebook request failed";
  if (userTitle) return `${userTitle}: ${userMessage || message}`;
  return message;
}

async function graphPost(path: string, token: string, body: Record<string, unknown>) {
  const response = await fetch(`${GRAPH_BASE_URL}/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...body, access_token: token }),
    cache: "no-store",
  });
  const payload: unknown = await response.json();
  if (!response.ok || asRecord(payload).error) {
    throw new Error(readGraphError(payload));
  }
  return asRecord(payload);
}

function normalizeAccountEdgeId(facebookAdAccountId: string, accountId: string | null): string {
  if (facebookAdAccountId.startsWith("act_")) return facebookAdAccountId;
  return `act_${accountId || facebookAdAccountId}`;
}

function replaceTemplateTokens(value: unknown, variables: Record<string, string>): unknown {
  if (typeof value === "string") {
    return value.replace(/{{\s*([a-zA-Z0-9_]+)\s*}}/g, (_full, key: string) => {
      return Object.prototype.hasOwnProperty.call(variables, key) ? String(variables[key] ?? "") : _full;
    });
  }
  if (Array.isArray(value)) return value.map((item) => replaceTemplateTokens(item, variables));
  if (value && typeof value === "object") {
    return Object.entries(value as Record<string, unknown>).reduce<Record<string, unknown>>((acc, [key, row]) => {
      acc[key] = replaceTemplateTokens(row, variables);
      return acc;
    }, {});
  }
  return value;
}

function normalizeFacebookDate(value: unknown): unknown {
  if (typeof value !== "string" || value.trim().length === 0) return value;
  const raw = value.trim();
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(raw)) {
    const parsed = new Date(raw);
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();
  }
  return value;
}

function applyOverridesToPayload(
  payload: Record<string, unknown>,
  targetPageId: string | null,
  targetWhatsappNumber: string | null
): Record<string, unknown> {
  const next = deepClone(payload);
  const campaign = asRecord(next.campaign);
  const adSets = Array.isArray(next.adSets) ? (next.adSets as Array<Record<string, unknown>>) : [];

  if (targetPageId) {
    const campaignPromoted = asRecord(campaign.promoted_object);
    if (Object.keys(campaignPromoted).length > 0 || campaignPromoted.page_id !== undefined) {
      campaignPromoted.page_id = targetPageId;
      campaign.promoted_object = campaignPromoted;
      next.campaign = campaign;
    }
  }

  adSets.forEach((adSet) => {
    const promoted = asRecord(adSet.promoted_object);
    if (targetPageId && (promoted.page_id !== undefined || Object.keys(promoted).length > 0)) {
      promoted.page_id = targetPageId;
    }
    if (targetWhatsappNumber) {
      if ("whatsapp_phone_number" in promoted || !("whatsapp_number" in promoted)) {
        promoted.whatsapp_phone_number = targetWhatsappNumber;
      }
      if ("whatsapp_number" in promoted) {
        promoted.whatsapp_number = targetWhatsappNumber;
      }
    }
    adSet.promoted_object = promoted;

    const ads = Array.isArray(adSet.ads) ? (adSet.ads as Array<Record<string, unknown>>) : [];
    ads.forEach((ad) => {
      const creative = asRecord(ad.creative);
      const story = asRecord(creative.object_story_spec);
      if (targetPageId && (story.page_id !== undefined || Object.keys(story).length > 0)) {
        story.page_id = targetPageId;
      }
      creative.object_story_spec = story;
      ad.creative = creative;
    });
    adSet.ads = ads;
  });
  next.adSets = adSets;

  return next;
}

function sanitizeCampaignCreatePayload(campaign: Record<string, unknown>): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    name: campaign.name,
    objective: campaign.objective,
    status: "PAUSED",
  };
  const passthroughKeys = [
    "buying_type",
    "special_ad_categories",
    "bid_strategy",
    "daily_budget",
    "lifetime_budget",
    "start_time",
    "stop_time",
  ];
  passthroughKeys.forEach((key) => {
    if (campaign[key] !== undefined && campaign[key] !== null && campaign[key] !== "") {
      payload[key] = key.includes("time") ? normalizeFacebookDate(campaign[key]) : campaign[key];
    }
  });

  // Budget guardrails: Facebook rejects 0 values and daily+lifetime together.
  const daily = Number(campaign.daily_budget ?? 0);
  const lifetime = Number(campaign.lifetime_budget ?? 0);
  if (!Number.isFinite(daily) || daily <= 0) delete payload.daily_budget;
  if (!Number.isFinite(lifetime) || lifetime <= 0) delete payload.lifetime_budget;
  if (payload.daily_budget && payload.lifetime_budget) delete payload.lifetime_budget;

  return payload;
}

function sanitizeAdSetCreatePayload(adSet: Record<string, unknown>, campaignId: string): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    campaign_id: campaignId,
    name: adSet.name,
    status: "PAUSED",
  };
  const passthroughKeys = [
    "optimization_goal",
    "billing_event",
    "bid_amount",
    "daily_budget",
    "lifetime_budget",
    "targeting",
    "promoted_object",
    "destination_type",
    "attribution_spec",
    "is_dynamic_creative",
    "start_time",
    "end_time",
  ];
  passthroughKeys.forEach((key) => {
    if (adSet[key] !== undefined && adSet[key] !== null && adSet[key] !== "") {
      payload[key] = key.includes("time") ? normalizeFacebookDate(adSet[key]) : adSet[key];
    }
  });

  const daily = Number(adSet.daily_budget ?? 0);
  const lifetime = Number(adSet.lifetime_budget ?? 0);
  if (!Number.isFinite(daily) || daily <= 0) delete payload.daily_budget;
  if (!Number.isFinite(lifetime) || lifetime <= 0) delete payload.lifetime_budget;
  if (payload.daily_budget && payload.lifetime_budget) delete payload.lifetime_budget;

  return payload;
}

function buildCreativePayload(ad: Record<string, unknown>, fallbackPageId: string | null): Record<string, unknown> {
  const creative = asRecord(ad.creative);
  const objectStorySpec = asRecord(creative.object_story_spec);
  if (fallbackPageId && !objectStorySpec.page_id) {
    objectStorySpec.page_id = fallbackPageId;
  }

  const payload: Record<string, unknown> = {
    name:
      (typeof creative.name === "string" && creative.name.trim()) ||
      (typeof ad.name === "string" && `Creative - ${ad.name}`) ||
      "Creative",
  };
  if (Object.keys(objectStorySpec).length > 0) {
    payload.object_story_spec = objectStorySpec;
  }
  if (creative.asset_feed_spec && typeof creative.asset_feed_spec === "object") {
    payload.asset_feed_spec = creative.asset_feed_spec;
  }

  if (!payload.object_story_spec) {
    const fallbackStory: Record<string, unknown> = {};
    if (fallbackPageId) fallbackStory.page_id = fallbackPageId;
    fallbackStory.link_data = {
      message: creative.body || "",
      name: creative.title || "",
      link: creative.link_url || (fallbackPageId ? `https://facebook.com/${fallbackPageId}` : "https://facebook.com"),
    };
    payload.object_story_spec = fallbackStory;
  }

  return payload;
}

export async function POST(request: NextRequest) {
  let launchId: string | null = null;
  try {
    const supabaseServer = await createServerSupabaseClient();
    const {
      data: { user },
      error: userError,
    } = await supabaseServer.auth.getUser();
    if (userError || !user) return jsonUtf8({ error: "Sesion invalida" }, { status: 401 });

    const body = (await request.json()) as PublishBody;
    if (!body.strategyId || !body.targetAdAccountId) {
      return jsonUtf8({ error: "strategyId y targetAdAccountId son requeridos" }, { status: 400 });
    }

    const { data: strategy, error: strategyError } = await supabaseServer
      .from("strategies")
      .select("id,name,import_metadata")
      .eq("id", body.strategyId)
      .single();
    if (strategyError || !strategy) {
      return jsonUtf8({ error: "No se encontro la estrategia" }, { status: 404 });
    }

    const { data: account, error: accountError } = await supabaseAdmin
      .from("facebook_ad_accounts")
      .select("facebook_ad_account_id,account_id")
      .eq("user_id", user.id)
      .eq("facebook_ad_account_id", body.targetAdAccountId)
      .maybeSingle();
    if (accountError) throw new Error(accountError.message);
    if (!account) {
      return jsonUtf8({ error: "La ad account seleccionada no pertenece al usuario" }, { status: 400 });
    }
    const accountEdgeId = normalizeAccountEdgeId(
      account.facebook_ad_account_id as string,
      (account.account_id as string | null) || null
    );

    const { data: connection, error: connectionError } = await supabaseAdmin
      .from("facebook_connections")
      .select("access_token")
      .eq("user_id", user.id)
      .maybeSingle();
    if (connectionError) throw new Error(connectionError.message);
    if (!connection?.access_token) return jsonUtf8({ error: "No hay conexion activa con Facebook" }, { status: 400 });
    const facebookToken = connection.access_token as string;

    const metadata = asRecord(strategy.import_metadata);
    const templateBuilder = asRecord(metadata.template_builder);
    const templatedPayload = asRecord(templateBuilder.templated_payload);
    if (!templatedPayload.campaign || !templatedPayload.adSets) {
      return jsonUtf8({ error: "La estrategia no tiene plantilla lista para publicar" }, { status: 400 });
    }

    const variables = body.templateVariables || {};
    const resolvedTemplated = replaceTemplateTokens(templatedPayload, variables) as Record<string, unknown>;
    const finalPayload = applyOverridesToPayload(
      resolvedTemplated,
      body.targetPageId || null,
      body.targetWhatsappNumber || null
    );

    const { data: launchRow, error: launchInsertError } = await supabaseAdmin
      .from("strategy_launches")
      .insert({
        strategy_id: strategy.id,
        user_id: user.id,
        target_ad_account_id: body.targetAdAccountId,
        target_page_id: body.targetPageId || null,
        target_whatsapp_number: body.targetWhatsappNumber || null,
        status: "DRAFT",
        publish_result: {
          template_variables: variables,
          template_variable_keys: Object.keys(variables),
        },
      })
      .select("id")
      .single();
    if (launchInsertError) throw new Error(launchInsertError.message);
    launchId = String((launchRow as { id?: string })?.id || "");
    if (!launchId) throw new Error("No se pudo crear el lanzamiento");

    const campaignInput = asRecord(finalPayload.campaign);
    const adSetsInput = Array.isArray(finalPayload.adSets) ? (finalPayload.adSets as Array<Record<string, unknown>>) : [];

    const createdEntityMap: Array<{
      launch_id: string;
      entity_level: "campaign" | "adset" | "ad";
      template_entity_key: string;
      facebook_entity_id: string;
      facebook_entity_name: string | null;
    }> = [];

    const createdCampaign = await graphPost(
      `${accountEdgeId}/campaigns`,
      facebookToken,
      sanitizeCampaignCreatePayload(campaignInput)
    );
    const createdCampaignId = String(createdCampaign.id || "");
    if (!createdCampaignId) throw new Error("Facebook no devolvio campaign id");
    createdEntityMap.push({
      launch_id: launchId,
      entity_level: "campaign",
      template_entity_key: `campaign:${String(campaignInput.id || "source")}`,
      facebook_entity_id: createdCampaignId,
      facebook_entity_name: (campaignInput.name as string) || null,
    });

    const adsetResults: Array<{ source_id: string; source_name: string; created_id: string; ads: Array<{ source_id: string; source_name: string; creative_id: string; created_id: string }> }> = [];
    for (const adSet of adSetsInput) {
      const createdAdSet = await graphPost(
        `${accountEdgeId}/adsets`,
        facebookToken,
        sanitizeAdSetCreatePayload(adSet, createdCampaignId)
      );
      const createdAdSetId = String(createdAdSet.id || "");
      if (!createdAdSetId) throw new Error("Facebook no devolvio ad set id");
      createdEntityMap.push({
        launch_id: launchId,
        entity_level: "adset",
        template_entity_key: `adset:${String(adSet.id || adSet.name || createdAdSetId)}`,
        facebook_entity_id: createdAdSetId,
        facebook_entity_name: (adSet.name as string) || null,
      });

      const adsInput = Array.isArray(adSet.ads) ? (adSet.ads as Array<Record<string, unknown>>) : [];
      const adResults: Array<{ source_id: string; source_name: string; creative_id: string; created_id: string }> = [];
      for (const ad of adsInput) {
        const creativePayload = buildCreativePayload(ad, body.targetPageId || null);
        const createdCreative = await graphPost(`${accountEdgeId}/adcreatives`, facebookToken, creativePayload);
        const creativeId = String(createdCreative.id || "");
        if (!creativeId) throw new Error("Facebook no devolvio creative id");

        const createdAd = await graphPost(`${accountEdgeId}/ads`, facebookToken, {
          adset_id: createdAdSetId,
          name: ad.name || "Ad",
          status: "PAUSED",
          creative: { creative_id: creativeId },
        });
        const createdAdId = String(createdAd.id || "");
        if (!createdAdId) throw new Error("Facebook no devolvio ad id");
        createdEntityMap.push({
          launch_id: launchId,
          entity_level: "ad",
          template_entity_key: `ad:${String(ad.id || ad.name || createdAdId)}`,
          facebook_entity_id: createdAdId,
          facebook_entity_name: (ad.name as string) || null,
        });
        adResults.push({
          source_id: String(ad.id || ""),
          source_name: String(ad.name || ""),
          creative_id: creativeId,
          created_id: createdAdId,
        });
      }

      adsetResults.push({
        source_id: String(adSet.id || ""),
        source_name: String(adSet.name || ""),
        created_id: createdAdSetId,
        ads: adResults,
      });
    }

    if (createdEntityMap.length > 0) {
      const { error: mapInsertError } = await supabaseAdmin.from("strategy_launch_entity_map").insert(createdEntityMap);
      if (mapInsertError) throw new Error(mapInsertError.message);
    }

    const publishResult = {
      success: true,
      campaign: {
        source_id: String(campaignInput.id || ""),
        source_name: String(campaignInput.name || ""),
        created_id: createdCampaignId,
      },
      adsets: adsetResults,
      template_variables: variables,
      published_at: new Date().toISOString(),
      status: "PAUSED",
    };

    const { error: launchUpdateError } = await supabaseAdmin
      .from("strategy_launches")
      .update({
        status: "PUBLISHED_PAUSED",
        published_campaign_id: createdCampaignId,
        publish_result: publishResult,
        error_message: null,
      })
      .eq("id", launchId);
    if (launchUpdateError) throw new Error(launchUpdateError.message);

    return jsonUtf8({
      success: true,
      launch_id: launchId,
      campaign_id: createdCampaignId,
      adset_count: adsetResults.length,
      ad_count: adsetResults.reduce((sum, row) => sum + row.ads.length, 0),
      status: "PUBLISHED_PAUSED",
      message: "Campana publicada en estado PAUSED",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "No se pudo publicar la campana";
    if (launchId) {
      await supabaseAdmin
        .from("strategy_launches")
        .update({
          status: "FAILED",
          error_message: message,
          publish_result: {
            success: false,
            error: message,
            failed_at: new Date().toISOString(),
          },
        })
        .eq("id", launchId);
    }
    return jsonUtf8({ error: message, launch_id: launchId }, { status: 500 });
  }
}
