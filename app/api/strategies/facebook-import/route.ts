import { NextRequest } from "next/server";
import { createClient as createServerSupabaseClient } from "../../../lib/supabase-server";
import { supabaseAdmin } from "../../../lib/supabase-admin";
import { jsonUtf8 } from "../../../lib/api-utf8";
import {
  getFacebookSdk,
  initFacebookApi,
  normalizeAdAccountEdgeId,
  readAllCursorPages,
  readFacebookError,
} from "../../../lib/facebook-sdk";

export const runtime = "nodejs";

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

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};
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
  initFacebookApi(token);

  const { data: account, error: accountError } = await supabaseAdmin
    .from("facebook_ad_accounts")
    .select("facebook_ad_account_id,account_id")
    .eq("user_id", userId)
    .eq("facebook_ad_account_id", adAccountId)
    .maybeSingle();

  if (accountError) throw new Error(accountError.message);
  if (!account) throw new Error("La cuenta publicitaria no pertenece al usuario");

  const accountEdgeId = normalizeAdAccountEdgeId(
    account.facebook_ad_account_id as string,
    (account.account_id as string | null) || null
  );

  const sdk = getFacebookSdk();
  const AdAccount = sdk.AdAccount;
  const Campaign = sdk.Campaign;

  const accountObject = new AdAccount(accountEdgeId);
  const campaignRows = await readAllCursorPages<FacebookCampaign>(
    accountObject.getCampaigns(
      [
        Campaign.Fields.id,
        Campaign.Fields.name,
        Campaign.Fields.objective,
        Campaign.Fields.status,
        Campaign.Fields.effective_status,
        Campaign.Fields.buying_type,
        Campaign.Fields.daily_budget,
        Campaign.Fields.lifetime_budget,
        Campaign.Fields.created_time,
        Campaign.Fields.updated_time,
        Campaign.Fields.special_ad_categories,
        Campaign.Fields.bid_strategy,
      ],
      { limit: 200 }
    ),
    { maxPages: 20, maxItems: 5000 }
  );

  const campaigns = campaignRows.map((row) => ({
    id: String(row.id || ""),
    name: String(row.name || ""),
    objective: row.objective,
    status: row.status,
    effective_status: row.effective_status,
    buying_type: row.buying_type,
    daily_budget: row.daily_budget,
    lifetime_budget: row.lifetime_budget,
    created_time: row.created_time,
    updated_time: row.updated_time,
    special_ad_categories: row.special_ad_categories,
    bid_strategy: row.bid_strategy,
  }));

  campaigns.sort((a, b) => {
    const aTs = a.updated_time || a.created_time || "";
    const bTs = b.updated_time || b.created_time || "";
    return bTs.localeCompare(aTs);
  });

  return campaigns;
}

async function fetchCampaign(userId: string, campaignId: string) {
  const token = await getUserToken(userId);
  initFacebookApi(token);

  const sdk = getFacebookSdk();
  const Campaign = sdk.Campaign;
  const AdSet = sdk.AdSet;
  const Ad = sdk.Ad;

  const campaignObject = new Campaign(campaignId);
  const campaign = (await campaignObject.read([
    Campaign.Fields.id,
    Campaign.Fields.name,
    Campaign.Fields.objective,
    Campaign.Fields.status,
    Campaign.Fields.effective_status,
    Campaign.Fields.buying_type,
    Campaign.Fields.daily_budget,
    Campaign.Fields.lifetime_budget,
    Campaign.Fields.special_ad_categories,
    Campaign.Fields.bid_strategy,
    Campaign.Fields.budget_remaining,
    Campaign.Fields.created_time,
    Campaign.Fields.start_time,
    Campaign.Fields.stop_time,
    Campaign.Fields.promoted_object,
  ])) as Record<string, unknown>;

  const adSets = await readAllCursorPages<Record<string, unknown>>(
    campaignObject.getAdSets(
      [
        AdSet.Fields.id,
        AdSet.Fields.name,
        AdSet.Fields.status,
        AdSet.Fields.effective_status,
        AdSet.Fields.optimization_goal,
        AdSet.Fields.billing_event,
        AdSet.Fields.bid_amount,
        AdSet.Fields.daily_budget,
        AdSet.Fields.lifetime_budget,
        AdSet.Fields.start_time,
        AdSet.Fields.end_time,
        AdSet.Fields.targeting,
        AdSet.Fields.promoted_object,
        AdSet.Fields.destination_type,
        AdSet.Fields.attribution_spec,
        AdSet.Fields.campaign_attribution,
        AdSet.Fields.is_dynamic_creative,
      ],
      { limit: 200 }
    ),
    { maxPages: 20, maxItems: 5000 }
  );

  const adSetsWithAds: Array<Record<string, unknown> & { ads: Array<Record<string, unknown>> }> = await Promise.all(
    adSets.map(async (adSet) => {
      const adSetId = String(adSet.id || "");
      const adSetObject = new AdSet(adSetId);
      const ads = await readAllCursorPages<Record<string, unknown>>(
        adSetObject.getAds(
          [
            Ad.Fields.id,
            Ad.Fields.name,
            Ad.Fields.status,
            Ad.Fields.effective_status,
            "creative{id,name,title,body,call_to_action_type,link_url,image_hash,image_url,video_id,thumbnail_url,object_story_spec,asset_feed_spec,url_tags}",
          ],
          { limit: 200 }
        ),
        { maxPages: 20, maxItems: 5000 }
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
        const creative = asRecord(ad.creative);
        const objectStorySpec = asRecord(creative.object_story_spec);
        const videoData = asRecord(objectStorySpec.video_data);
        const linkData = asRecord(objectStorySpec.link_data);

        return {
          id: ad.id,
          name: ad.name,
          status: ad.status,
          effective_status: ad.effective_status,
          creative: {
            id: creative.id,
            name: creative.name,
            title: creative.title || videoData.title || linkData.name || "",
            body: creative.body || videoData.message || linkData.message || "",
            call_to_action:
              creative.call_to_action_type ||
              asRecord(videoData.call_to_action).type ||
              asRecord(linkData.call_to_action).type ||
              "",
            link_url: creative.link_url || videoData.link || linkData.link || "",
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
    const message = readFacebookError(err, "No se pudo importar la campana");
    return jsonUtf8({ error: message }, { status: 500 });
  }
}

