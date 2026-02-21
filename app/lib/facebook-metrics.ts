import { supabaseAdmin } from "./supabase-admin";
import {
  classifyAdset,
  parseMessagingResultCount,
  type ClassificationResult,
  type PerformanceType,
} from "./adset-classification";

type GraphPagingResponse<T> = {
  data?: T[];
  paging?: { next?: string };
  error?: { message?: string };
};

type GraphAd = {
  id: string;
  effective_status?: string;
  campaign?: { id?: string; effective_status?: string };
  adset?: { id?: string };
};

type GraphInsight = {
  spend?: string;
  actions?: Array<{ action_type?: string; value?: string }>;
};

type GraphAdset = {
  id: string;
  name?: string;
  status?: string;
  optimization_goal?: string;
  billing_event?: string;
  destination_type?: string;
  promoted_object?: Record<string, unknown>;
  campaign?: { id?: string; name?: string; objective?: string };
};

type AdAccountRow = {
  facebook_ad_account_id: string;
  account_id: string | null;
  name: string | null;
  currency: string | null;
};

type DashboardAdAccountMetricRow = {
  user_id: string;
  facebook_ad_account_id: string;
  account_id: string | null;
  account_name: string | null;
  active_ads_count: number;
  is_active_account: boolean;
  account_status: number | null;
  spend_original: number;
  currency: string | null;
  spend_usd: number;
  leads_count: number;
  cost_per_result_usd: number | null;
  source_date: string;
  last_synced_at: string;
};

type MessagingAdAccountMetricRow = {
  user_id: string;
  facebook_ad_account_id: string;
  account_id: string | null;
  account_name: string | null;
  active_ads_count: number;
  is_active_account: boolean;
  account_status: number | null;
  spend_original: number;
  currency: string | null;
  spend_usd: number;
  results_count: number;
  cost_per_result_usd: number | null;
  source_date: string;
  last_synced_at: string;
};

type ManualOverride = {
  facebook_adset_id: string;
  performance_type: PerformanceType | null;
  classification_source: string | null;
  confidence_score: number | null;
};

export type DashboardSyncSummary = {
  userId: string;
  activeAccountsCount: number;
  activeAdsCount: number;
  totalSpendUsd: number;
  totalLeads: number;
  costPerResultUsd: number | null;
};

export type MessagingSyncSummary = {
  userId: string;
  activeAccountsCount: number;
  activeAdsCount: number;
  totalSpendUsd: number;
  totalResults: number;
  costPerResultUsd: number | null;
};

export type UserSyncSummary = {
  dashboard: DashboardSyncSummary;
  messaging: MessagingSyncSummary;
};

const GRAPH_BASE_URL = "https://graph.facebook.com/v23.0";

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { method: "GET", cache: "no-store" });
  const payload: unknown = await response.json();

  if (!response.ok) {
    const message =
      typeof payload === "object" &&
      payload !== null &&
      "error" in payload &&
      typeof (payload as { error?: { message?: string } }).error?.message === "string"
        ? (payload as { error?: { message?: string } }).error!.message!
        : "Meta request failed";
    throw new Error(message);
  }

  return payload as T;
}

async function graphFetchPaginated<T>(url: string, maxPages = 10): Promise<T[]> {
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

async function fetchUsdRates(): Promise<Record<string, number>> {
  try {
    const payload = await fetchJson<{ rates?: Record<string, number> }>(
      "https://open.er-api.com/v6/latest/USD"
    );
    return payload.rates || {};
  } catch {
    return {};
  }
}

function convertToUsd(amount: number, currency: string | null, rates: Record<string, number>) {
  if (!currency || currency.toUpperCase() === "USD") return amount;

  const rate = rates[currency.toUpperCase()];
  if (!rate || rate <= 0) return amount;

  return amount / rate;
}

function isActiveStatus(status: string | undefined) {
  return status === "ACTIVE";
}

function parseLeadCount(actions?: Array<{ action_type?: string; value?: string }>) {
  if (!actions || actions.length === 0) return 0;

  const leadActionTypes = new Set([
    "lead",
    "onsite_conversion.lead_grouped",
    "onsite_conversion.lead",
    "offsite_conversion.fb_pixel_lead",
    "offsite_conversion.lead",
  ]);

  return actions.reduce((sum, action) => {
    if (!action.action_type || !leadActionTypes.has(action.action_type)) return sum;
    return sum + Number(action.value || 0);
  }, 0);
}

async function getUserAdAccounts(userId: string) {
  const { data: adAccounts, error } = await supabaseAdmin
    .from("facebook_ad_accounts")
    .select("facebook_ad_account_id,account_id,name,currency")
    .eq("user_id", userId);

  if (error) throw new Error(error.message);
  return (adAccounts || []) as AdAccountRow[];
}

async function getUserConnectionId(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("facebook_connections")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data?.id) throw new Error("No se encontró facebook connection id");
  return data.id as string;
}

async function getManualOverrides(userId: string): Promise<Map<string, ManualOverride>> {
  const { data, error } = await supabaseAdmin
    .from("facebook_adsets")
    .select("facebook_adset_id,performance_type,classification_source,confidence_score")
    .eq("user_id", userId)
    .eq("manual_override", true);

  if (error) {
    // If columns are not migrated yet, return empty map and continue.
    return new Map<string, ManualOverride>();
  }

  const map = new Map<string, ManualOverride>();
  (data || []).forEach((row) => {
    map.set(row.facebook_adset_id as string, {
      facebook_adset_id: row.facebook_adset_id as string,
      performance_type: (row.performance_type as PerformanceType | null) || null,
      classification_source: (row.classification_source as string | null) || null,
      confidence_score: (row.confidence_score as number | null) || null,
    });
  });
  return map;
}

function getRoundedSnapshotTime(nowIso: string) {
  const roundedNow = new Date(nowIso);
  roundedNow.setUTCSeconds(0, 0);
  const roundedMinutes = Math.floor(roundedNow.getUTCMinutes() / 10) * 10;
  roundedNow.setUTCMinutes(roundedMinutes);
  return roundedNow.toISOString();
}

export async function syncUserDashboardMetrics(
  userId: string,
  token: string,
  usdRates?: Record<string, number>
): Promise<DashboardSyncSummary> {
  const rates = usdRates || (await fetchUsdRates());
  const rows = await getUserAdAccounts(userId);

  let activeAccountsCount = 0;
  let activeAdsCount = 0;
  let totalLeads = 0;
  const detailRows: DashboardAdAccountMetricRow[] = [];
  const nowIso = new Date().toISOString();
  const sourceDate = nowIso.slice(0, 10);

  for (const ad of rows) {
    const accountEdgeId = ad.facebook_ad_account_id.startsWith("act_")
      ? ad.facebook_ad_account_id
      : `act_${ad.account_id || ad.facebook_ad_account_id}`;

    const activeAds = await graphFetchPaginated<GraphAd>(
      `${GRAPH_BASE_URL}/${accountEdgeId}/ads?fields=id,effective_status,campaign{id,effective_status}&limit=200&access_token=${encodeURIComponent(token)}`,
      10
    ).catch(() => []);

    const realActiveAds = activeAds.filter(
      (adRow) =>
        isActiveStatus(adRow.effective_status) &&
        isActiveStatus(adRow.campaign?.effective_status)
    );

    const accountActiveAdsCount = realActiveAds.length;
    const isActiveAccount = accountActiveAdsCount > 0;

    const accountMeta = await fetchJson<{ account_status?: number }>(
      `${GRAPH_BASE_URL}/${accountEdgeId}?fields=account_status&access_token=${encodeURIComponent(token)}`
    ).catch((): { account_status?: number } => ({}));

    const accountStatus =
      typeof accountMeta.account_status === "number" ? accountMeta.account_status : null;

    const insights = await fetchJson<GraphPagingResponse<GraphInsight>>(
      `${GRAPH_BASE_URL}/${accountEdgeId}/insights?fields=spend,actions&date_preset=today&level=account&limit=1&access_token=${encodeURIComponent(token)}`
    ).catch(() => ({ data: [] }));

    const insightRow = insights.data?.[0];
    const spendValue = Number(insightRow?.spend || 0);
    const leadsCount = parseLeadCount(insightRow?.actions);
    const spendUsd = spendValue > 0 ? convertToUsd(spendValue, ad.currency, rates) : 0;
    const costPerResultUsd = leadsCount > 0 ? Number((spendUsd / leadsCount).toFixed(2)) : null;

    if (isActiveAccount) {
      activeAccountsCount += 1;
      activeAdsCount += accountActiveAdsCount;
    }

    totalLeads += leadsCount;

    detailRows.push({
      user_id: userId,
      facebook_ad_account_id: ad.facebook_ad_account_id,
      account_id: ad.account_id || null,
      account_name: ad.name || null,
      active_ads_count: accountActiveAdsCount,
      is_active_account: isActiveAccount,
      account_status: accountStatus,
      spend_original: Number(spendValue.toFixed(2)),
      currency: ad.currency || null,
      spend_usd: Number(spendUsd.toFixed(2)),
      leads_count: leadsCount,
      cost_per_result_usd: costPerResultUsd,
      source_date: sourceDate,
      last_synced_at: nowIso,
    });
  }

  const totalSpendUsd = detailRows.reduce((sum, row) => sum + row.spend_usd, 0);
  const costPerResultUsd = totalLeads > 0 ? Number((totalSpendUsd / totalLeads).toFixed(2)) : null;

  const { error: detailDeleteError } = await supabaseAdmin
    .from("facebook_dashboard_ad_account_metrics")
    .delete()
    .eq("user_id", userId);
  if (detailDeleteError) throw new Error(detailDeleteError.message);

  if (detailRows.length > 0) {
    const { error: detailInsertError } = await supabaseAdmin
      .from("facebook_dashboard_ad_account_metrics")
      .insert(detailRows);
    if (detailInsertError) throw new Error(detailInsertError.message);
  }

  const { error: upsertError } = await supabaseAdmin.from("facebook_dashboard_metrics").upsert(
    {
      user_id: userId,
      active_accounts_count: activeAccountsCount,
      active_ads_count: activeAdsCount,
      total_spend_usd: Number(totalSpendUsd.toFixed(2)),
      total_leads: totalLeads,
      cost_per_result_usd: costPerResultUsd,
      source_date: sourceDate,
      last_synced_at: nowIso,
      updated_at: nowIso,
    },
    { onConflict: "user_id" }
  );
  if (upsertError) throw new Error(upsertError.message);

  const { error: seriesError } = await supabaseAdmin.from("facebook_dashboard_timeseries").upsert(
    {
      user_id: userId,
      snapshot_time: getRoundedSnapshotTime(nowIso),
      source_date: sourceDate,
      spend_usd: Number(totalSpendUsd.toFixed(2)),
      leads_count: totalLeads,
      cost_per_result_usd: costPerResultUsd,
    },
    { onConflict: "user_id,snapshot_time" }
  );
  if (seriesError) throw new Error(seriesError.message);

  return {
    userId,
    activeAccountsCount,
    activeAdsCount,
    totalSpendUsd: Number(totalSpendUsd.toFixed(2)),
    totalLeads,
    costPerResultUsd,
  };
}

export async function syncUserMessagingMetrics(
  userId: string,
  token: string,
  usdRates?: Record<string, number>
): Promise<MessagingSyncSummary> {
  const rates = usdRates || (await fetchUsdRates());
  const rows = await getUserAdAccounts(userId);
  const connectionId = await getUserConnectionId(userId);
  const manualOverrides = await getManualOverrides(userId);

  let activeAccountsCount = 0;
  let activeAdsCount = 0;
  let totalResults = 0;
  const accountRows: MessagingAdAccountMetricRow[] = [];

  const nowIso = new Date().toISOString();
  const sourceDate = nowIso.slice(0, 10);

  for (const ad of rows) {
    const accountEdgeId = ad.facebook_ad_account_id.startsWith("act_")
      ? ad.facebook_ad_account_id
      : `act_${ad.account_id || ad.facebook_ad_account_id}`;

    const accountMeta = await fetchJson<{ account_status?: number }>(
      `${GRAPH_BASE_URL}/${accountEdgeId}?fields=account_status&access_token=${encodeURIComponent(token)}`
    ).catch((): { account_status?: number } => ({}));
    const accountStatus =
      typeof accountMeta.account_status === "number" ? accountMeta.account_status : null;

    const activeAds = await graphFetchPaginated<GraphAd>(
      `${GRAPH_BASE_URL}/${accountEdgeId}/ads?fields=id,effective_status,campaign{id,effective_status},adset{id}&limit=500&access_token=${encodeURIComponent(token)}`,
      20
    ).catch(() => []);

    const activeAdsByAdset = new Map<string, number>();
    activeAds.forEach((graphAd) => {
      const adsetId = graphAd.adset?.id;
      if (!adsetId) return;
      const isRunning =
        isActiveStatus(graphAd.effective_status) && isActiveStatus(graphAd.campaign?.effective_status);
      if (!isRunning) return;
      activeAdsByAdset.set(adsetId, (activeAdsByAdset.get(adsetId) || 0) + 1);
    });

    const adsets = await graphFetchPaginated<GraphAdset>(
      `${GRAPH_BASE_URL}/${accountEdgeId}/adsets?fields=id,name,status,optimization_goal,billing_event,destination_type,promoted_object,campaign{id,name,objective}&limit=200&access_token=${encodeURIComponent(token)}`,
      20
    ).catch(() => []);

    let accountSpendOriginal = 0;
    let accountResults = 0;
    let accountActiveAds = 0;

    for (const adset of adsets) {
      const insights = await fetchJson<GraphPagingResponse<GraphInsight>>(
        `${GRAPH_BASE_URL}/${adset.id}/insights?fields=spend,actions&date_preset=today&limit=1&access_token=${encodeURIComponent(token)}`
      ).catch(() => ({ data: [] }));

      const insightRow = insights.data?.[0];
      const spendValue = Number(insightRow?.spend || 0);
      const messagingResults = parseMessagingResultCount(insightRow?.actions);

      const manual = manualOverrides.get(adset.id);
      let classification: ClassificationResult;
      if (manual?.performance_type) {
        classification = {
          performanceType: manual.performance_type,
          classificationSource: "manual",
          confidenceScore: manual.confidence_score ?? 100,
        };
      } else {
        classification = classifyAdset(
          {
            optimization_goal: adset.optimization_goal || null,
            billing_event: adset.billing_event || null,
            destination_type: adset.destination_type || null,
            promoted_object: adset.promoted_object || null,
            campaign_objective: adset.campaign?.objective || null,
          },
          { actions: insightRow?.actions }
        );
      }

      const { error: adsetUpsertError } = await supabaseAdmin.from("facebook_adsets").upsert(
        {
          connection_id: connectionId,
          user_id: userId,
          facebook_ad_account_id: ad.facebook_ad_account_id,
          facebook_adset_id: adset.id,
          campaign_id: adset.campaign?.id || null,
          campaign_name: adset.campaign?.name || null,
          name: adset.name || null,
          status: adset.status || null,
          performance_type: classification.performanceType,
          classification_source: classification.classificationSource,
          confidence_score: classification.confidenceScore,
        },
        { onConflict: "user_id,facebook_adset_id" }
      );

      if (adsetUpsertError) {
        throw new Error(adsetUpsertError.message);
      }

      if (classification.performanceType !== "MESSAGING") continue;

      accountSpendOriginal += spendValue;
      accountResults += messagingResults;
      accountActiveAds += activeAdsByAdset.get(adset.id) || 0;
    }

    const accountSpendUsd = convertToUsd(accountSpendOriginal, ad.currency, rates);
    const accountCostPerResult =
      accountResults > 0 ? Number((accountSpendUsd / accountResults).toFixed(2)) : null;
    const isActiveAccount = accountActiveAds > 0;

    if (accountSpendOriginal <= 0 && accountResults <= 0 && accountActiveAds <= 0) {
      continue;
    }

    if (isActiveAccount) {
      activeAccountsCount += 1;
      activeAdsCount += accountActiveAds;
    }

    totalResults += accountResults;

    accountRows.push({
      user_id: userId,
      facebook_ad_account_id: ad.facebook_ad_account_id,
      account_id: ad.account_id || null,
      account_name: ad.name || null,
      active_ads_count: accountActiveAds,
      is_active_account: isActiveAccount,
      account_status: accountStatus,
      spend_original: Number(accountSpendOriginal.toFixed(2)),
      currency: ad.currency || null,
      spend_usd: Number(accountSpendUsd.toFixed(2)),
      results_count: accountResults,
      cost_per_result_usd: accountCostPerResult,
      source_date: sourceDate,
      last_synced_at: nowIso,
    });
  }

  const totalSpendUsd = accountRows.reduce((sum, row) => sum + row.spend_usd, 0);
  const costPerResultUsd = totalResults > 0 ? Number((totalSpendUsd / totalResults).toFixed(2)) : null;

  const { error: detailDeleteError } = await supabaseAdmin
    .from("facebook_messages_ad_account_metrics")
    .delete()
    .eq("user_id", userId);
  if (detailDeleteError) throw new Error(detailDeleteError.message);

  if (accountRows.length > 0) {
    const { error: detailInsertError } = await supabaseAdmin
      .from("facebook_messages_ad_account_metrics")
      .insert(accountRows);
    if (detailInsertError) throw new Error(detailInsertError.message);
  }

  const { error: summaryUpsertError } = await supabaseAdmin.from("facebook_messages_metrics").upsert(
    {
      user_id: userId,
      active_accounts_count: activeAccountsCount,
      active_ads_count: activeAdsCount,
      total_spend_usd: Number(totalSpendUsd.toFixed(2)),
      total_results: totalResults,
      cost_per_result_usd: costPerResultUsd,
      source_date: sourceDate,
      last_synced_at: nowIso,
      updated_at: nowIso,
    },
    { onConflict: "user_id" }
  );
  if (summaryUpsertError) throw new Error(summaryUpsertError.message);

  const { error: seriesError } = await supabaseAdmin.from("facebook_messages_timeseries").upsert(
    {
      user_id: userId,
      snapshot_time: getRoundedSnapshotTime(nowIso),
      source_date: sourceDate,
      spend_usd: Number(totalSpendUsd.toFixed(2)),
      results_count: totalResults,
      cost_per_result_usd: costPerResultUsd,
    },
    { onConflict: "user_id,snapshot_time" }
  );
  if (seriesError) throw new Error(seriesError.message);

  return {
    userId,
    activeAccountsCount,
    activeAdsCount,
    totalSpendUsd: Number(totalSpendUsd.toFixed(2)),
    totalResults,
    costPerResultUsd,
  };
}

export async function syncUserAllMetrics(
  userId: string,
  token: string,
  usdRates?: Record<string, number>
): Promise<UserSyncSummary> {
  const rates = usdRates || (await fetchUsdRates());
  const dashboard = await syncUserDashboardMetrics(userId, token, rates);
  const messaging = await syncUserMessagingMetrics(userId, token, rates);
  return { dashboard, messaging };
}

export async function syncAllDashboardMetrics() {
  const { data: connections, error } = await supabaseAdmin
    .from("facebook_connections")
    .select("user_id,access_token");

  if (error) {
    throw new Error(error.message);
  }

  const usdRates = await fetchUsdRates();
  const results: DashboardSyncSummary[] = [];
  const failures: Array<{ userId: string; error: string }> = [];

  for (const connection of connections || []) {
    const userId = connection.user_id as string;
    const token = connection.access_token as string;

    try {
      const summary = await syncUserAllMetrics(userId, token, usdRates);
      results.push(summary.dashboard);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown sync error";
      failures.push({ userId, error: message });
      console.error("[facebook-metrics] sync user failed", { userId, message });
    }
  }

  return { processed: results.length, failed: failures.length, results, failures };
}
