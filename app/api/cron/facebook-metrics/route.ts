import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../../../lib/supabase-admin";

type GraphPagingResponse<T> = {
  data?: T[];
  paging?: { next?: string };
  error?: { message?: string };
};

type GraphAd = {
  id: string;
  effective_status?: string;
  campaign?: { id?: string; effective_status?: string };
  adset?: { id?: string; effective_status?: string };
};

type GraphInsight = {
  spend?: string;
};

type AdAccountRow = {
  facebook_ad_account_id: string;
  account_id: string | null;
  currency: string | null;
};

const GRAPH_BASE_URL = "https://graph.facebook.com/v23.0";

function isAuthorized(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return true;

  const header = request.headers.get("authorization") || "";
  return header === `Bearer ${cronSecret}`;
}

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

async function syncUserMetrics(userId: string, token: string, usdRates: Record<string, number>) {
  const { data: adAccounts, error: adAccountsError } = await supabaseAdmin
    .from("facebook_ad_accounts")
    .select("facebook_ad_account_id,account_id,currency")
    .eq("user_id", userId);

  if (adAccountsError) {
    throw new Error(adAccountsError.message);
  }

  const rows = (adAccounts || []) as AdAccountRow[];

  let activeAccountsCount = 0;
  let activeAdsCount = 0;
  let totalSpendUsd = 0;

  for (const ad of rows) {
    const accountEdgeId = ad.facebook_ad_account_id.startsWith("act_")
      ? ad.facebook_ad_account_id
      : `act_${ad.account_id || ad.facebook_ad_account_id}`;

    const activeAds = await graphFetchPaginated<GraphAd>(
      `${GRAPH_BASE_URL}/${accountEdgeId}/ads?fields=id,effective_status,campaign{id,effective_status},adset{id,effective_status}&limit=200&access_token=${encodeURIComponent(token)}`,
      10
    ).catch(() => []);

    const realActiveAds = activeAds.filter(
      (adRow) =>
        isActiveStatus(adRow.effective_status) &&
        isActiveStatus(adRow.campaign?.effective_status) &&
        isActiveStatus(adRow.adset?.effective_status)
    );

    if (realActiveAds.length > 0) {
      activeAccountsCount += 1;
      activeAdsCount += realActiveAds.length;
    }

    const insights = await fetchJson<GraphPagingResponse<GraphInsight>>(
      `${GRAPH_BASE_URL}/${accountEdgeId}/insights?fields=spend&date_preset=today&level=account&limit=1&access_token=${encodeURIComponent(token)}`
    ).catch(() => ({ data: [] }));

    const spendValue = Number(insights.data?.[0]?.spend || 0);
    if (spendValue > 0) {
      totalSpendUsd += convertToUsd(spendValue, ad.currency, usdRates);
    }
  }

  const { error: upsertError } = await supabaseAdmin.from("facebook_dashboard_metrics").upsert(
    {
      user_id: userId,
      active_accounts_count: activeAccountsCount,
      active_ads_count: activeAdsCount,
      total_spend_usd: Number(totalSpendUsd.toFixed(2)),
      source_date: new Date().toISOString().slice(0, 10),
      last_synced_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (upsertError) {
    throw new Error(upsertError.message);
  }

  return {
    userId,
    activeAccountsCount,
    activeAdsCount,
    totalSpendUsd: Number(totalSpendUsd.toFixed(2)),
  };
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { data: connections, error } = await supabaseAdmin
      .from("facebook_connections")
      .select("user_id,access_token");

    if (error) {
      throw new Error(error.message);
    }

    const usdRates = await fetchUsdRates();
    const results: Array<{
      userId: string;
      activeAccountsCount: number;
      activeAdsCount: number;
      totalSpendUsd: number;
    }> = [];

    for (const connection of connections || []) {
      const userId = connection.user_id as string;
      const token = connection.access_token as string;

      try {
        const summary = await syncUserMetrics(userId, token, usdRates);
        results.push(summary);
      } catch {
        // Continue with next user to avoid blocking full sync.
      }
    }

    return NextResponse.json({ ok: true, processed: results.length, results });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Metrics sync failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
