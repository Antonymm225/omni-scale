import { supabaseAdmin } from "./supabase-admin";

type GraphPagingResponse<T> = {
  data?: T[];
  paging?: { next?: string };
  error?: { message?: string };
};

type GraphAd = {
  id: string;
  effective_status?: string;
  campaign?: { id?: string; effective_status?: string };
};

type GraphInsight = {
  spend?: string;
  actions?: Array<{ action_type?: string; value?: string }>;
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

export type DashboardSyncSummary = {
  userId: string;
  activeAccountsCount: number;
  activeAdsCount: number;
  totalSpendUsd: number;
  totalLeads: number;
  costPerResultUsd: number | null;
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

export async function syncUserDashboardMetrics(
  userId: string,
  token: string,
  usdRates?: Record<string, number>
): Promise<DashboardSyncSummary> {
  const rates = usdRates || (await fetchUsdRates());

  const { data: adAccounts, error: adAccountsError } = await supabaseAdmin
    .from("facebook_ad_accounts")
    .select("facebook_ad_account_id,account_id,name,currency")
    .eq("user_id", userId);

  if (adAccountsError) {
    throw new Error(adAccountsError.message);
  }

  const rows = (adAccounts || []) as AdAccountRow[];

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
  const costPerResultUsd =
    totalLeads > 0 ? Number((totalSpendUsd / totalLeads).toFixed(2)) : null;

  const { error: detailDeleteError } = await supabaseAdmin
    .from("facebook_dashboard_ad_account_metrics")
    .delete()
    .eq("user_id", userId);

  if (detailDeleteError) {
    throw new Error(detailDeleteError.message);
  }

  if (detailRows.length > 0) {
    const { error: detailInsertError } = await supabaseAdmin
      .from("facebook_dashboard_ad_account_metrics")
      .insert(detailRows);

    if (detailInsertError) {
      throw new Error(detailInsertError.message);
    }
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

  if (upsertError) {
    throw new Error(upsertError.message);
  }

  const roundedNow = new Date(nowIso);
  roundedNow.setUTCSeconds(0, 0);
  const roundedMinutes = Math.floor(roundedNow.getUTCMinutes() / 10) * 10;
  roundedNow.setUTCMinutes(roundedMinutes);

  const { error: seriesError } = await supabaseAdmin.from("facebook_dashboard_timeseries").upsert(
    {
      user_id: userId,
      snapshot_time: roundedNow.toISOString(),
      source_date: sourceDate,
      spend_usd: Number(totalSpendUsd.toFixed(2)),
      leads_count: totalLeads,
      cost_per_result_usd: costPerResultUsd,
    },
    { onConflict: "user_id,snapshot_time" }
  );

  if (seriesError) {
    throw new Error(seriesError.message);
  }

  return {
    userId,
    activeAccountsCount,
    activeAdsCount,
    totalSpendUsd: Number(totalSpendUsd.toFixed(2)),
    totalLeads,
    costPerResultUsd,
  };
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
      const summary = await syncUserDashboardMetrics(userId, token, usdRates);
      results.push(summary);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown sync error";
      failures.push({ userId, error: message });
      console.error("[facebook-metrics] sync user failed", { userId, message });
    }
  }

  return { processed: results.length, failed: failures.length, results, failures };
}
