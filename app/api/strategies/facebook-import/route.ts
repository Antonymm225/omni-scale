import { NextRequest } from "next/server";
import { createClient as createServerSupabaseClient } from "../../../lib/supabase-server";
import { supabaseAdmin } from "../../../lib/supabase-admin";
import { jsonUtf8 } from "../../../lib/api-utf8";

type ListCampaignsBody = {
  action: "list_campaigns";
  adAccountId: string;
};

type FetchCampaignBody = {
  action: "fetch_campaign";
  campaignId: string;
};

type ImportRequestBody = ListCampaignsBody | FetchCampaignBody;

type FacebookCampaign = {
  id: string;
  name: string;
  objective?: string;
  status?: string;
  effective_status?: string;
  buying_type?: string;
  daily_budget?: string;
  lifetime_budget?: string;
  created_time?: string;
  updated_time?: string;
  special_ad_categories?: string[];
  bid_strategy?: string;
};

type GraphPagingResponse<T> = {
  data?: T[];
  paging?: { next?: string };
  error?: { message?: string };
};

const GRAPH_BASE_URL = "https://graph.facebook.com/v23.0";

function readGraphError(payload: unknown): string {
  if (typeof payload === "object" && payload !== null) {
    const maybeError = (payload as { error?: { message?: string } }).error;
    if (typeof maybeError?.message === "string") return maybeError.message;
  }
  return "Facebook request failed";
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { method: "GET", cache: "no-store" });
  const payload: unknown = await response.json();

  if (!response.ok) {
    throw new Error(readGraphError(payload));
  }

  return payload as T;
}

async function graphFetchPaginated<T>(url: string, maxPages = 20): Promise<T[]> {
  const rows: T[] = [];
  let nextUrl: string | undefined = url;
  let pages = 0;

  while (nextUrl && pages < maxPages) {
    const page: GraphPagingResponse<T> = await fetchJson<GraphPagingResponse<T>>(nextUrl);
    if (page.error?.message) throw new Error(page.error.message);
    if (page.data?.length) rows.push(...page.data);
    nextUrl = page.paging?.next;
    pages += 1;
  }

  return rows;
}

function normalizeAccountEdgeId(facebookAdAccountId: string, accountId: string | null): string {
  if (facebookAdAccountId.startsWith("act_")) return facebookAdAccountId;
  return `act_${accountId || facebookAdAccountId}`;
}

async function getUserToken(userId: string): Promise<string> {
  const { data, error } = await supabaseAdmin
    .from("facebook_connections")
    .select("access_token")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data?.access_token) throw new Error("No hay conexion activa con Facebook");

  return data.access_token as string;
}

async function listCampaigns(userId: string, adAccountId: string) {
  const token = await getUserToken(userId);

  const { data: account, error: accountError } = await supabaseAdmin
    .from("facebook_ad_accounts")
    .select("facebook_ad_account_id,account_id")
    .eq("user_id", userId)
    .eq("facebook_ad_account_id", adAccountId)
    .maybeSingle();

  if (accountError) throw new Error(accountError.message);
  if (!account) throw new Error("La cuenta publicitaria no pertenece al usuario");

  const accountEdgeId = normalizeAccountEdgeId(
    account.facebook_ad_account_id as string,
    (account.account_id as string | null) || null
  );

  const campaigns = await graphFetchPaginated<FacebookCampaign>(
    `${GRAPH_BASE_URL}/${accountEdgeId}/campaigns` +
      `?fields=id,name,objective,status,effective_status,buying_type,daily_budget,lifetime_budget,created_time,updated_time,special_ad_categories,bid_strategy` +
      `&limit=200&access_token=${encodeURIComponent(token)}`,
    20
  );

  campaigns.sort((a, b) => {
    const aTs = a.updated_time || a.created_time || "";
    const bTs = b.updated_time || b.created_time || "";
    return bTs.localeCompare(aTs);
  });

  return campaigns;
}

async function fetchCampaign(userId: string, campaignId: string) {
  const token = await getUserToken(userId);

  const campaign = await fetchJson<Record<string, unknown>>(
    `${GRAPH_BASE_URL}/${campaignId}` +
      `?fields=id,name,objective,status,effective_status,buying_type,daily_budget,lifetime_budget,special_ad_categories,bid_strategy,budget_remaining,created_time,start_time,stop_time,promoted_object` +
      `&access_token=${encodeURIComponent(token)}`
  );

  const adSets = await graphFetchPaginated<Record<string, unknown>>(
    `${GRAPH_BASE_URL}/${campaignId}/adsets` +
      `?fields=id,name,status,effective_status,optimization_goal,billing_event,bid_amount,daily_budget,lifetime_budget,start_time,end_time,targeting,promoted_object,destination_type,attribution_spec,campaign_attribution,is_dynamic_creative` +
      `&limit=200&access_token=${encodeURIComponent(token)}`,
    20
  );

  const adSetsWithAds: Array<Record<string, unknown> & { ads: Array<Record<string, unknown>> }> = await Promise.all(
    adSets.map(async (adSet) => {
      const adSetId = String(adSet.id || "");
      const ads = await graphFetchPaginated<Record<string, unknown>>(
        `${GRAPH_BASE_URL}/${adSetId}/ads` +
          `?fields=id,name,status,effective_status,creative{id,name,title,body,call_to_action_type,link_url,image_hash,image_url,video_id,thumbnail_url,object_story_spec,asset_feed_spec,url_tags}` +
          `&limit=200&access_token=${encodeURIComponent(token)}`,
        20
      );

      return { ...adSet, ads };
    })
  );

  const response = {
    campaign: {
      id: campaign.id,
      name: campaign.name,
      objective: campaign.objective,
      status: campaign.status,
      effective_status: campaign.effective_status,
      buying_type: campaign.buying_type,
      daily_budget: campaign.daily_budget,
      lifetime_budget: campaign.lifetime_budget,
      special_ad_categories: campaign.special_ad_categories,
      bid_strategy: campaign.bid_strategy,
      start_time: campaign.start_time,
      stop_time: campaign.stop_time,
      promoted_object: campaign.promoted_object,
    },
    adSets: adSetsWithAds.map((adSet) => ({
      id: adSet.id,
      name: adSet.name,
      status: adSet.status,
      effective_status: adSet.effective_status,
      optimization_goal: adSet.optimization_goal,
      billing_event: adSet.billing_event,
      bid_amount: adSet.bid_amount,
      daily_budget: adSet.daily_budget,
      lifetime_budget: adSet.lifetime_budget,
      start_time: adSet.start_time,
      end_time: adSet.end_time,
      targeting: adSet.targeting,
      promoted_object: adSet.promoted_object,
      destination_type: adSet.destination_type,
      attribution_spec: adSet.attribution_spec,
      is_dynamic_creative: adSet.is_dynamic_creative,
      ads: ((adSet.ads as Array<Record<string, unknown>>) || []).map((ad) => {
        const creative = (ad.creative as Record<string, unknown>) || {};
        const objectStorySpec =
          (creative.object_story_spec as Record<string, unknown>) || {};
        const videoData =
          (objectStorySpec.video_data as Record<string, unknown>) || {};
        const linkData =
          (objectStorySpec.link_data as Record<string, unknown>) || {};

        return {
          id: ad.id,
          name: ad.name,
          status: ad.status,
          effective_status: ad.effective_status,
          creative: {
            id: creative.id,
            name: creative.name,
            title:
              creative.title ||
              videoData.title ||
              linkData.name ||
              "",
            body:
              creative.body ||
              videoData.message ||
              linkData.message ||
              "",
            call_to_action:
              creative.call_to_action_type ||
              ((videoData.call_to_action as Record<string, unknown> | undefined)?.type as string | undefined) ||
              ((linkData.call_to_action as Record<string, unknown> | undefined)?.type as string | undefined) ||
              "",
            link_url:
              creative.link_url ||
              videoData.link ||
              linkData.link ||
              "",
            image_hash: creative.image_hash || linkData.image_hash || "",
            image_url: creative.image_url || linkData.picture || "",
            video_id: creative.video_id || videoData.video_id || "",
            thumbnail_url: creative.thumbnail_url || videoData.image_url || "",
            url_tags: creative.url_tags || "",
            object_story_spec: creative.object_story_spec || null,
            asset_feed_spec: creative.asset_feed_spec || null,
          },
        };
      }),
    })),
  };

  return response;
}

export async function POST(request: NextRequest) {
  try {
    const supabaseServer = await createServerSupabaseClient();
    const {
      data: { user },
      error: userError,
    } = await supabaseServer.auth.getUser();

    if (userError || !user) {
      return jsonUtf8({ error: "Sesion invalida" }, { status: 401 });
    }

    const body = (await request.json()) as Partial<ImportRequestBody>;

    if (body.action === "list_campaigns") {
      if (!body.adAccountId) {
        return jsonUtf8({ error: "adAccountId es requerido" }, { status: 400 });
      }

      const campaigns = await listCampaigns(user.id, body.adAccountId);
      return jsonUtf8({ campaigns });
    }

    if (body.action === "fetch_campaign") {
      if (!body.campaignId) {
        return jsonUtf8({ error: "campaignId es requerido" }, { status: 400 });
      }

      const data = await fetchCampaign(user.id, body.campaignId);
      return jsonUtf8(data);
    }

    return jsonUtf8({ error: "Accion invalida" }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "No se pudo importar la campana";
    return jsonUtf8({ error: message }, { status: 500 });
  }
}
