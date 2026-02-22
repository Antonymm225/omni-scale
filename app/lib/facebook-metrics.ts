import { supabaseAdmin } from "./supabase-admin";
import {
  classifyAdset,
  parseMessagingResultCount,
  type ClassificationResult,
  type PerformanceType,
} from "./adset-classification";
import { createOpenAiClient, extractJsonObject } from "./openai-client";

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
  campaign_id?: string;
  campaign_name?: string;
  adset_id?: string;
  adset_name?: string;
  ad_id?: string;
  ad_name?: string;
  spend?: string;
  impressions?: string;
  clicks?: string;
  ctr?: string;
  cpm?: string;
  frequency?: string;
  actions?: Array<{ action_type?: string; value?: string }>;
};

type GraphAdsetInsight = GraphInsight & {
  adset_id?: string;
};

type GraphAdset = {
  id: string;
  name?: string;
  status?: string;
  effective_status?: string;
  optimization_goal?: string;
  billing_event?: string;
  destination_type?: string;
  promoted_object?: Record<string, unknown>;
  campaign?: { id?: string; name?: string; objective?: string };
};

type GraphCampaign = {
  id: string;
  status?: string;
  effective_status?: string;
};

type GraphAdStatus = {
  id: string;
  status?: string;
  effective_status?: string;
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
  active_campaigns_count: number;
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
  active_campaigns_count: number;
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

type LeadsAdAccountMetricRow = {
  user_id: string;
  facebook_ad_account_id: string;
  account_id: string | null;
  account_name: string | null;
  active_campaigns_count: number;
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

type BrandingAdAccountMetricRow = {
  user_id: string;
  facebook_ad_account_id: string;
  account_id: string | null;
  account_name: string | null;
  active_campaigns_count: number;
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

type SalesAdAccountMetricRow = {
  user_id: string;
  facebook_ad_account_id: string;
  account_id: string | null;
  account_name: string | null;
  active_campaigns_count: number;
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

type ClassifiedAdsetRow = {
  facebook_adset_id: string;
  facebook_ad_account_id: string;
  campaign_id: string | null;
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

export type BrandingSyncSummary = {
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
  leads: DashboardSyncSummary;
  branding: BrandingSyncSummary;
  sales: BrandingSyncSummary;
  monitoring: { userId: string; entitiesTracked: number };
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

  // Avoid double counting: Meta can return multiple lead action types for the same result.
  // We pick a single canonical metric with precedence, then fallback to max lead-like value.
  const normalized = actions.map((action) => ({
    type: (action.action_type || "").toLowerCase(),
    value: Number(action.value || 0),
  }));

  const precedence = [
    "lead",
    "onsite_conversion.lead",
    "onsite_conversion.lead_grouped",
    "offsite_conversion.lead",
    "offsite_conversion.fb_pixel_lead",
  ];

  for (const actionType of precedence) {
    const match = normalized.find((item) => item.type === actionType);
    if (match) return match.value;
  }

  const leadLike = normalized.filter(
    (item) =>
      item.type.includes("lead") ||
      item.type.includes("complete_registration") ||
      item.type.includes("omni_lead")
  );

  if (leadLike.length === 0) return 0;
  return Math.max(...leadLike.map((item) => item.value));
}

function parseBrandingResultCount(actions?: Array<{ action_type?: string; value?: string }>) {
  if (!actions || actions.length === 0) return 0;

  const normalized = actions.map((action) => ({
    type: (action.action_type || "").toLowerCase(),
    value: Number(action.value || 0),
  }));

  const precedence = [
    "post_engagement",
    "page_engagement",
    "link_click",
    "landing_page_view",
    "video_view",
    "thruplay",
    "page_like",
    "page_follow",
    "post_reaction",
    "post_comment",
    "post",
  ];

  for (const actionType of precedence) {
    const match = normalized.find((item) => item.type === actionType);
    if (match) return match.value;
  }

  const brandingLike = normalized.filter(
    (item) =>
      item.type.includes("engagement") ||
      item.type.includes("video_view") ||
      item.type.includes("thruplay") ||
      item.type.includes("like") ||
      item.type.includes("follow") ||
      item.type.includes("link_click")
  );

  if (brandingLike.length === 0) return 0;
  return Math.max(...brandingLike.map((item) => item.value));
}

function parseUnifiedResultCount(actions?: Array<{ action_type?: string; value?: string }>) {
  if (!actions || actions.length === 0) return 0;

  const normalized = actions.map((action) => ({
    type: (action.action_type || "").toLowerCase(),
    value: Number(action.value || 0),
  }));

  const precedence = [
    "purchase",
    "lead",
    "onsite_conversion.messaging_conversation_started",
    "messages_started_7d",
    "post_engagement",
    "link_click",
    "video_view",
    "thruplay",
  ];

  for (const actionType of precedence) {
    const match = normalized.find((item) => item.type === actionType);
    if (match) return match.value;
  }

  return Math.max(...normalized.map((item) => item.value), 0);
}

function parseSalesResultCount(actions?: Array<{ action_type?: string; value?: string }>) {
  if (!actions || actions.length === 0) return 0;

  const normalized = actions.map((action) => ({
    type: (action.action_type || "").toLowerCase(),
    value: Number(action.value || 0),
  }));

  const precedence = [
    "purchase",
    "offsite_conversion.fb_pixel_purchase",
    "omni_purchase",
  ];

  for (const actionType of precedence) {
    const match = normalized.find((item) => item.type === actionType);
    if (match) return match.value;
  }

  const purchaseLike = normalized.filter((item) => item.type.includes("purchase"));
  if (purchaseLike.length === 0) return 0;
  return Math.max(...purchaseLike.map((item) => item.value));
}

type MonitoringTrend = "improving" | "stable" | "worsening";
type MonitoringHealth = "good" | "watch" | "bad";
type AiRecommendation = "improving" | "stable" | "scale" | "worsening";
type AiAction = "none" | "scale_up" | "pause_ad" | "pause_adset" | "pause_campaign" | "pause_account";
type AiRunStatus = "idle" | "running" | "completed" | "skipped" | "error";

const OPENAI_PERFORMANCE_SYSTEM_PROMPT =
  process.env.OPENAI_PERFORMANCE_SYSTEM_PROMPT ||
  [
    "You are an elite Meta Ads performance analyst.",
    "Analyze trend features for each entity and return strict JSON only.",
    "Output format:",
    "{\"items\":[{\"key\":\"...\",\"recommendation\":\"improving|stable|scale|worsening\",\"confidence\":0-100,\"reason\":\"max 10 Spanish words\"}]}",
    "Rules:",
    "- Base decision on trend of the day, not only current point.",
    "- Use spend, results, cost_per_result, cpm, ctr, cpc and feature deltas.",
    "- If data is noisy/low volume, prefer stable with medium confidence.",
  ].join(" ");

function getTrend(
  currentCpr: number | null,
  currentResults: number,
  previousCpr: number | null,
  previousResults: number | null
): MonitoringTrend {
  if (previousCpr == null || currentCpr == null) return "stable";
  const prevResults = previousResults ?? 0;

  if (currentCpr <= previousCpr * 0.9 || currentResults >= prevResults * 1.15) {
    return "improving";
  }
  if (currentCpr >= previousCpr * 1.1 && currentResults <= prevResults * 0.9) {
    return "worsening";
  }
  return "stable";
}

function getHealth(
  spendUsd: number,
  results: number,
  cpr: number | null,
  trend: MonitoringTrend
): MonitoringHealth {
  if (spendUsd >= 10 && results === 0) return "bad";
  if (trend === "worsening" && cpr != null) return "bad";
  if (results >= 5 && (trend === "improving" || cpr == null || cpr <= 3)) return "good";
  return "watch";
}

function getCpcUsd(spendUsd: number, clicks: number) {
  if (clicks <= 0) return null;
  return Number((spendUsd / clicks).toFixed(4));
}

function normalizeAiReasonShort(reason: string) {
  const words = reason
    .trim()
    .replace(/\s+/g, " ")
    .split(" ")
    .filter(Boolean)
    .slice(0, 10);
  return words.join(" ");
}

type FeaturePoint = {
  at: string;
  spendUsd: number;
  resultsCount: number;
  costPerResultUsd: number | null;
  cpm: number | null;
  ctr: number | null;
  cpcUsd: number | null;
};

type AiFeatureVector = {
  pointsDay: number;
  spendDelta30m: number;
  resultsDelta30m: number;
  cprDelta30mPct: number | null;
  cprDelta120mPct: number | null;
  ctrDelta120mPct: number | null;
  cpcDelta120mPct: number | null;
  cpmDelta120mPct: number | null;
  resultsGrowthDay: number;
  cprVolatility: number | null;
  summary: string;
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function pctDelta(current: number | null, previous: number | null) {
  if (current == null || previous == null || previous === 0) return null;
  return (current - previous) / Math.abs(previous);
}

function stdDev(values: number[]) {
  if (values.length < 2) return 0;
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

function getClosestPointBefore(points: FeaturePoint[], targetMs: number) {
  let candidate: FeaturePoint | null = null;
  for (const p of points) {
    const pMs = new Date(p.at).getTime();
    if (pMs <= targetMs) candidate = p;
  }
  return candidate;
}

function summarizeFeatureVector(feature: AiFeatureVector) {
  const cpr120 =
    feature.cprDelta120mPct == null ? "na" : `${(feature.cprDelta120mPct * 100).toFixed(1)}%`;
  const ctr120 =
    feature.ctrDelta120mPct == null ? "na" : `${(feature.ctrDelta120mPct * 100).toFixed(1)}%`;
  return `pts:${feature.pointsDay} d30s:${feature.spendDelta30m.toFixed(2)} d30r:${feature.resultsDelta30m} cpr120:${cpr120} ctr120:${ctr120}`;
}

function buildAiFeatureVector(points: FeaturePoint[]): AiFeatureVector {
  const sorted = [...points].sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
  const current = sorted[sorted.length - 1];
  const nowMs = new Date(current.at).getTime();
  const p30 = getClosestPointBefore(sorted, nowMs - 30 * 60 * 1000);
  const p120 = getClosestPointBefore(sorted, nowMs - 120 * 60 * 1000);
  const first = sorted[0];
  const cprSeries = sorted
    .map((p) => (p.costPerResultUsd == null ? null : Number(p.costPerResultUsd)))
    .filter((v): v is number => v != null);
  const vol = cprSeries.length > 1 ? stdDev(cprSeries) : null;

  const vector: AiFeatureVector = {
    pointsDay: sorted.length,
    spendDelta30m: Number((current.spendUsd - (p30?.spendUsd || current.spendUsd)).toFixed(2)),
    resultsDelta30m: current.resultsCount - (p30?.resultsCount || current.resultsCount),
    cprDelta30mPct: pctDelta(current.costPerResultUsd, p30?.costPerResultUsd ?? null),
    cprDelta120mPct: pctDelta(current.costPerResultUsd, p120?.costPerResultUsd ?? null),
    ctrDelta120mPct: pctDelta(current.ctr, p120?.ctr ?? null),
    cpcDelta120mPct: pctDelta(current.cpcUsd, p120?.cpcUsd ?? null),
    cpmDelta120mPct: pctDelta(current.cpm, p120?.cpm ?? null),
    resultsGrowthDay: current.resultsCount - first.resultsCount,
    cprVolatility: vol == null ? null : Number(vol.toFixed(3)),
    summary: "",
  };
  vector.summary = summarizeFeatureVector(vector);
  return vector;
}

function getRuleConfidence(
  row: Record<string, unknown>,
  feature: AiFeatureVector | undefined
) {
  let score = 50;
  const trend = (row.trend as MonitoringTrend) || "stable";
  const health = (row.health as MonitoringHealth) || "watch";
  const spend = Number(row.spend_usd || 0);
  const results = Number(row.results_count || 0);

  if (feature) {
    if (feature.pointsDay >= 6) score += 10;
    if (feature.pointsDay >= 12) score += 8;
    if ((feature.resultsDelta30m >= 2 || feature.resultsGrowthDay >= 4) && spend > 0) score += 8;
    if ((feature.cprDelta120mPct ?? 0) <= -0.1 || (feature.cprDelta120mPct ?? 0) >= 0.12) score += 8;
    if ((feature.ctrDelta120mPct ?? 0) >= 0.1 || (feature.cpcDelta120mPct ?? 0) <= -0.1) score += 6;
    if ((feature.cprVolatility ?? 0) > 6) score -= 8;
  }

  if (trend === "worsening" && health === "bad") score += 8;
  if (trend === "improving" && results >= 3) score += 8;
  if (spend < 5 && results === 0) score -= 10;

  return clamp(Math.round(score), 35, 95);
}

function getRuleBasedAiRecommendation(params: {
  trend: MonitoringTrend;
  health: MonitoringHealth;
  resultsCount: number;
  costPerResultUsd: number | null;
  cpm: number | null;
  ctr: number | null;
  cpcUsd: number | null;
}): { recommendation: AiRecommendation; reason: string } {
  const { trend, health, resultsCount, costPerResultUsd, cpm, ctr, cpcUsd } = params;

  if (trend === "improving" && resultsCount >= 3) {
    return { recommendation: "scale", reason: "Sube resultados con costo estable, puedes escalar" };
  }
  if (trend === "worsening" || health === "bad") {
    return { recommendation: "worsening", reason: "Sube costo y cae rendimiento del activo" };
  }
  if (health === "good" && (ctr ?? 0) >= 1) {
    return { recommendation: "improving", reason: "Buen CTR y conversion consistente en el periodo" };
  }
  if ((costPerResultUsd ?? 0) > 0 && (cpcUsd ?? 0) > 0 && (cpm ?? 0) > 0) {
    return { recommendation: "stable", reason: "Metricas estables sin cambios fuertes recientes" };
  }
  return { recommendation: "stable", reason: "Volumen bajo aun, mantener observacion en curso" };
}

function getAiSlotIso(nowIso: string) {
  const d = new Date(nowIso);
  d.setUTCSeconds(0, 0);
  d.setUTCMinutes(Math.floor(d.getUTCMinutes() / 30) * 30);
  return d.toISOString();
}

function shouldAnalyzeWithOpenAi(
  row: Record<string, unknown>,
  previous: { cost_per_result_usd: number | null; results_count: number | null } | undefined,
  feature: AiFeatureVector | undefined
) {
  const entityType = (row.entity_type as string) || "";
  const spendUsd = Number(row.spend_usd || 0);
  const results = Number(row.results_count || 0);
  const health = (row.health as string) || "watch";
  const trend = (row.trend as string) || "stable";
  const currentCpr = row.cost_per_result_usd == null ? null : Number(row.cost_per_result_usd);
  const previousCpr = previous?.cost_per_result_usd ?? null;
  const previousResults = previous?.results_count ?? null;

  // Accounts are derived from children; no direct OpenAI analysis at account level.
  if (entityType === "account") return false;
  if (entityType === "campaign" && spendUsd > 0 && (feature?.pointsDay || 0) >= 3) return true;
  if (health === "bad" || trend === "worsening") return true;
  if (spendUsd >= 20) return true;
  if (results >= 5 && trend !== "stable") return true;

  if (feature) {
    if (Math.abs(feature.cprDelta120mPct ?? 0) >= 0.12) return true;
    if (Math.abs(feature.ctrDelta120mPct ?? 0) >= 0.15) return true;
    if (Math.abs(feature.cpcDelta120mPct ?? 0) >= 0.15) return true;
    if (Math.abs(feature.cpmDelta120mPct ?? 0) >= 0.15) return true;
    if (Math.abs(feature.resultsDelta30m) >= 2) return true;
  }

  if (currentCpr != null && previousCpr != null && previousCpr > 0) {
    const cprDelta = Math.abs(currentCpr - previousCpr) / previousCpr;
    if (cprDelta >= 0.15) return true;
  }
  if (previousResults != null && previousResults > 0) {
    const resultsDelta = Math.abs(results - previousResults) / previousResults;
    if (resultsDelta >= 0.2) return true;
  }

  return false;
}

async function acquireAiRunSlot(userId: string, slotIso: string) {
  const { data: runData, error: runError } = await supabaseAdmin
    .from("facebook_ai_runs")
    .select("last_ai_run_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (runError) throw new Error(runError.message);

  const alreadyRan =
    runData?.last_ai_run_at && new Date(runData.last_ai_run_at as string).getTime() >= new Date(slotIso).getTime();
  if (alreadyRan) return false;

  const { error: upsertError } = await supabaseAdmin
    .from("facebook_ai_runs")
    .upsert({ user_id: userId, last_ai_run_at: slotIso }, { onConflict: "user_id" });
  if (upsertError) throw new Error(upsertError.message);
  return true;
}

async function updateAiRunTelemetry(
  userId: string,
  payload: {
    last_ai_run_at?: string | null;
    last_slot_at?: string | null;
    last_status?: AiRunStatus | null;
    last_error?: string | null;
    last_openai_entities?: number | null;
    last_total_entities?: number | null;
    last_model?: string | null;
  }
) {
  try {
    const { error } = await supabaseAdmin
      .from("facebook_ai_runs")
      .upsert({ user_id: userId, ...payload }, { onConflict: "user_id" });
    if (error) {
      console.error("[facebook-metrics] ai telemetry upsert failed", { userId, message: error.message });
    }
  } catch (err) {
    console.error("[facebook-metrics] ai telemetry upsert exception", {
      userId,
      message: err instanceof Error ? err.message : "unknown",
    });
  }
}

async function getUserOpenAiApiKey(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("user_integrations")
    .select("openai_api_key")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  const key = (data?.openai_api_key as string | null) || null;
  return key && key.trim() ? key.trim() : null;
}

type AiRowInput = {
  key: string;
  entity_type: string;
  entity_id: string;
  spend_usd: number;
  results_count: number;
  cost_per_result_usd: number | null;
  cpm: number | null;
  ctr: number | null;
  cpc_usd: number | null;
  trend: MonitoringTrend;
  health: MonitoringHealth;
  feature: AiFeatureVector | null;
};

async function getOpenAiRecommendations(
  apiKey: string,
  rows: AiRowInput[]
): Promise<Map<string, { recommendation: AiRecommendation; reason: string; confidence: number }>> {
  const resultMap = new Map<string, { recommendation: AiRecommendation; reason: string; confidence: number }>();
  if (rows.length === 0) return resultMap;

  const client = createOpenAiClient(apiKey);
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

  const response = await client.responses.create({
    model,
    temperature: 0.1,
    input: [
      {
        role: "system",
        content: OPENAI_PERFORMANCE_SYSTEM_PROMPT,
      },
      {
        role: "user",
        content: JSON.stringify({
          instruction:
            "Analiza tendencia del dia por entidad y decide recommendation. reason en espanol max 10 palabras. Devuelve solo JSON.",
          rows,
        }),
      },
    ],
  });

  const raw = response.output_text || "";
  const parsed = extractJsonObject(raw) as {
    items?: Array<{ key?: string; recommendation?: string; reason?: string; confidence?: number }>;
  };

  (parsed.items || []).forEach((item) => {
    if (!item.key) return;
    const rec = (item.recommendation || "").toLowerCase();
    if (rec !== "improving" && rec !== "stable" && rec !== "scale" && rec !== "worsening") return;
    resultMap.set(item.key, {
      recommendation: rec as AiRecommendation,
      reason: normalizeAiReasonShort(item.reason || "Analisis AI"),
      confidence: clamp(Number(item.confidence || 65), 35, 99),
    });
  });

  return resultMap;
}

type SnapshotFeatureRow = {
  entity_type: string;
  entity_id: string;
  snapshot_time: string;
  spend_usd: number | null;
  results_count: number | null;
  cost_per_result_usd: number | null;
  cpm: number | null;
  ctr: number | null;
  cpc_usd: number | null;
};

async function getTodayFeatureMap(
  userId: string,
  sourceDate: string,
  currentRows: Array<Record<string, unknown>>
) {
  const { data, error } = await supabaseAdmin
    .from("facebook_performance_snapshots")
    .select("entity_type,entity_id,snapshot_time,spend_usd,results_count,cost_per_result_usd,cpm,ctr,cpc_usd")
    .eq("user_id", userId)
    .eq("source_date", sourceDate);
  if (error) throw new Error(error.message);

  const byKey = new Map<string, FeaturePoint[]>();
  ((data || []) as SnapshotFeatureRow[]).forEach((row) => {
    const key = `${row.entity_type}:${row.entity_id}`;
    const items = byKey.get(key) || [];
    items.push({
      at: row.snapshot_time,
      spendUsd: Number(row.spend_usd || 0),
      resultsCount: Number(row.results_count || 0),
      costPerResultUsd: row.cost_per_result_usd == null ? null : Number(row.cost_per_result_usd),
      cpm: row.cpm == null ? null : Number(row.cpm),
      ctr: row.ctr == null ? null : Number(row.ctr),
      cpcUsd: row.cpc_usd == null ? null : Number(row.cpc_usd),
    });
    byKey.set(key, items);
  });

  currentRows.forEach((row) => {
    const key = `${row.entity_type as string}:${row.entity_id as string}`;
    const items = byKey.get(key) || [];
    items.push({
      at: (row.last_synced_at as string) || new Date().toISOString(),
      spendUsd: Number(row.spend_usd || 0),
      resultsCount: Number(row.results_count || 0),
      costPerResultUsd: row.cost_per_result_usd == null ? null : Number(row.cost_per_result_usd),
      cpm: row.cpm == null ? null : Number(row.cpm),
      ctr: row.ctr == null ? null : Number(row.ctr),
      cpcUsd: row.cpc_usd == null ? null : Number(row.cpc_usd),
    });
    byKey.set(key, items);
  });

  const featureMap = new Map<string, AiFeatureVector>();
  byKey.forEach((points, key) => {
    if (points.length === 0) return;
    featureMap.set(key, buildAiFeatureVector(points));
  });
  return featureMap;
}

function deriveAccountAiFromCampaigns(rows: Array<Record<string, unknown>>) {
  const accountRows = rows.filter((row) => row.entity_type === "account");
  const campaignRows = rows.filter((row) => row.entity_type === "campaign");
  const recWeight = (value: AiRecommendation | null | undefined) => {
    if (value === "scale") return 2;
    if (value === "improving") return 1;
    if (value === "worsening") return -2;
    return 0;
  };

  accountRows.forEach((accountRow) => {
    const accountKey = accountRow.facebook_ad_account_id as string;
    const children = campaignRows.filter(
      (campaignRow) => (campaignRow.facebook_ad_account_id as string) === accountKey
    );
    if (children.length === 0) {
      accountRow.ai_recommendation = "stable";
      accountRow.ai_confidence_score = 50;
      accountRow.ai_reason_short = "Sin campanas hijas para evaluar";
      accountRow.ai_model = "derived";
      return;
    }

    const allWorsening = children.every(
      (child) => ((child.ai_recommendation as AiRecommendation | null) || "stable") === "worsening"
    );
    if (allWorsening) {
      accountRow.ai_recommendation = "worsening";
      accountRow.ai_confidence_score = 92;
      accountRow.ai_reason_short = "Todas las campanas empeoran en la cuenta";
      accountRow.ai_model = "derived";
      return;
    }

    let totalWeight = 0;
    let weightedRec = 0;
    let weightedConfidence = 0;
    children.forEach((child) => {
      const spend = Number(child.spend_usd || 0);
      const weight = spend > 0 ? spend : 1;
      totalWeight += weight;
      weightedRec += recWeight((child.ai_recommendation as AiRecommendation | null) || "stable") * weight;
      weightedConfidence += Number(child.ai_confidence_score || 55) * weight;
    });

    const recScore = totalWeight > 0 ? weightedRec / totalWeight : 0;
    const confidence = totalWeight > 0 ? Math.round(weightedConfidence / totalWeight) : 55;
    const recommendation: AiRecommendation =
      recScore >= 0.9 ? "scale" : recScore >= 0.2 ? "improving" : recScore <= -0.8 ? "worsening" : "stable";

    accountRow.ai_recommendation = recommendation;
    accountRow.ai_confidence_score = clamp(confidence, 35, 95);
    accountRow.ai_reason_short =
      recommendation === "scale"
        ? "Campanas fuertes sostienen rendimiento para escalar"
        : recommendation === "improving"
          ? "Campanas mejoran en costo y volumen"
          : recommendation === "worsening"
            ? "Campanas con deterioro sostenido de rendimiento"
            : "Cuenta estable por promedio de campanas";
    accountRow.ai_model = "derived";
    accountRow.ai_feature_summary = "derived_from_campaign_children";
  });
}

function applyHierarchicalAiActions(rows: Array<Record<string, unknown>>) {
  const getRec = (row: Record<string, unknown>) => (row.ai_recommendation as AiRecommendation | null) || "stable";
  const setAction = (row: Record<string, unknown>, action: AiAction) => {
    row.ai_action = action;
  };

  rows.forEach((row) => {
    setAction(row, getRec(row) === "scale" ? "scale_up" : "none");
  });

  const adRows = rows.filter((row) => row.entity_type === "ad");
  adRows.forEach((row) => {
    if (getRec(row) === "worsening") setAction(row, "pause_ad");
  });

  const adsetRows = rows.filter((row) => row.entity_type === "adset");
  adsetRows.forEach((adsetRow) => {
    const adsetId = adsetRow.entity_id as string;
    const children = adRows.filter((adRow) => (adRow.adset_id as string | null) === adsetId);
    if (
      getRec(adsetRow) === "worsening" ||
      (children.length > 0 && children.every((child) => getRec(child) === "worsening"))
    ) {
      setAction(adsetRow, "pause_adset");
    }
  });

  const campaignRows = rows.filter((row) => row.entity_type === "campaign");
  campaignRows.forEach((campaignRow) => {
    const campaignId = campaignRow.entity_id as string;
    const children = adsetRows.filter((adsetRow) => (adsetRow.campaign_id as string | null) === campaignId);
    if (
      getRec(campaignRow) === "worsening" ||
      (children.length > 0 && children.every((child) => getRec(child) === "worsening"))
    ) {
      setAction(campaignRow, "pause_campaign");
    }
  });

  const accountRows = rows.filter((row) => row.entity_type === "account");
  accountRows.forEach((accountRow) => {
    const accountId = accountRow.facebook_ad_account_id as string;
    const children = campaignRows.filter((campaignRow) => (campaignRow.facebook_ad_account_id as string) === accountId);
    if (
      getRec(accountRow) === "worsening" ||
      (children.length > 0 && children.every((child) => getRec(child) === "worsening"))
    ) {
      setAction(accountRow, "pause_account");
    }
  });
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

async function getClassifiedAdsetsForUser(userId: string, performanceType: PerformanceType) {
  const { data, error } = await supabaseAdmin
    .from("facebook_adsets")
    .select("facebook_adset_id,facebook_ad_account_id,campaign_id")
    .eq("user_id", userId)
    .eq("performance_type", performanceType);

  if (error) throw new Error(error.message);
  return (data || []) as ClassifiedAdsetRow[];
}

function getRoundedSnapshotTime(nowIso: string) {
  const roundedNow = new Date(nowIso);
  roundedNow.setUTCSeconds(0, 0);
  const roundedMinutes = Math.floor(roundedNow.getUTCMinutes() / 10) * 10;
  roundedNow.setUTCMinutes(roundedMinutes);
  return roundedNow.toISOString();
}

function formatDateUtc(date: Date) {
  return date.toISOString().slice(0, 10);
}

async function getUserReportingTimezone(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("timezone_name")
    .eq("id", userId)
    .maybeSingle();
  if (error) return "America/Lima";
  const value = (data?.timezone_name as string | null) || "";
  return value.trim() || "America/Lima";
}

function formatDateInTimezone(nowIso: string, timeZone: string) {
  const date = new Date(nowIso);
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const year = parts.find((p) => p.type === "year")?.value || "1970";
  const month = parts.find((p) => p.type === "month")?.value || "01";
  const day = parts.find((p) => p.type === "day")?.value || "01";
  return `${year}-${month}-${day}`;
}

async function applyTimeseriesRetention(table: string, userId: string, nowIso: string) {
  const now = new Date(nowIso);
  const cutoff = new Date(now);
  cutoff.setUTCDate(cutoff.getUTCDate() - 7);
  const cutoffIso = cutoff.toISOString();

  const { error: deleteOldError } = await supabaseAdmin
    .from(table)
    .delete()
    .eq("user_id", userId)
    .lt("snapshot_time", cutoffIso);
  if (deleteOldError) throw new Error(deleteOldError.message);

  const yesterdayStart = new Date(now);
  yesterdayStart.setUTCHours(0, 0, 0, 0);
  yesterdayStart.setUTCDate(yesterdayStart.getUTCDate() - 1);
  const yesterdayStartIso = yesterdayStart.toISOString();

  const { data: oldRows, error: oldRowsError } = await supabaseAdmin
    .from(table)
    .select("id,source_date,snapshot_time")
    .eq("user_id", userId)
    .lt("snapshot_time", yesterdayStartIso)
    .gte("snapshot_time", cutoffIso)
    .order("source_date", { ascending: true })
    .order("snapshot_time", { ascending: false });

  if (oldRowsError) throw new Error(oldRowsError.message);

  const keepByDate = new Set<string>();
  const deleteIds: string[] = [];

  (oldRows || []).forEach((row) => {
    const dateKey = row.source_date as string;
    const id = row.id as string;
    if (!keepByDate.has(dateKey)) {
      keepByDate.add(dateKey);
      return;
    }
    deleteIds.push(id);
  });

  if (deleteIds.length > 0) {
    const { error: deleteCompactedError } = await supabaseAdmin
      .from(table)
      .delete()
      .in("id", deleteIds);
    if (deleteCompactedError) throw new Error(deleteCompactedError.message);
  }
}

async function applyDailyRetention(table: string, userId: string, nowIso: string) {
  const now = new Date(nowIso);
  const cutoff = new Date(now);
  cutoff.setUTCDate(cutoff.getUTCDate() - 7);
  const cutoffDate = formatDateUtc(cutoff);

  const { error } = await supabaseAdmin
    .from(table)
    .delete()
    .eq("user_id", userId)
    .lt("source_date", cutoffDate);

  if (error) throw new Error(error.message);
}

async function upsertAdAccountMetricsRows(
  table: string,
  rows: Array<Record<string, unknown>>
) {
  if (rows.length === 0) return;

  // Preferred schema: unique(user_id, facebook_ad_account_id, source_date)
  const firstTry = await supabaseAdmin
    .from(table)
    .upsert(rows, { onConflict: "user_id,facebook_ad_account_id,source_date" });
  if (!firstTry.error) return;

  const message = firstTry.error.message || "";
  const legacyUniqueConflict =
    message.includes("duplicate key value violates unique constraint") &&
    message.includes("user_id_facebook_ad_account");

  if (!legacyUniqueConflict) {
    throw new Error(firstTry.error.message);
  }

  // Legacy schema fallback: unique(user_id, facebook_ad_account_id)
  const secondTry = await supabaseAdmin
    .from(table)
    .upsert(rows, { onConflict: "user_id,facebook_ad_account_id" });
  if (secondTry.error) throw new Error(secondTry.error.message);
}

async function applyPerformanceSnapshotRetention(userId: string, nowIso: string) {
  const now = new Date(nowIso);
  const cutoff = new Date(now);
  cutoff.setUTCDate(cutoff.getUTCDate() - 7);
  const cutoffIso = cutoff.toISOString();

  const { error: deleteOldError } = await supabaseAdmin
    .from("facebook_performance_snapshots")
    .delete()
    .eq("user_id", userId)
    .lt("snapshot_time", cutoffIso);
  if (deleteOldError) throw new Error(deleteOldError.message);

  const yesterdayStart = new Date(now);
  yesterdayStart.setUTCHours(0, 0, 0, 0);
  yesterdayStart.setUTCDate(yesterdayStart.getUTCDate() - 1);
  const yesterdayStartIso = yesterdayStart.toISOString();

  const { data: oldRows, error: oldRowsError } = await supabaseAdmin
    .from("facebook_performance_snapshots")
    .select("id,entity_type,entity_id,source_date,snapshot_time")
    .eq("user_id", userId)
    .lt("snapshot_time", yesterdayStartIso)
    .gte("snapshot_time", cutoffIso)
    .order("entity_type", { ascending: true })
    .order("entity_id", { ascending: true })
    .order("source_date", { ascending: true })
    .order("snapshot_time", { ascending: false });

  if (oldRowsError) throw new Error(oldRowsError.message);

  const keepByKey = new Set<string>();
  const deleteIds: string[] = [];

  (oldRows || []).forEach((row) => {
    const key = `${row.entity_type as string}:${row.entity_id as string}:${row.source_date as string}`;
    const id = row.id as string;
    if (!keepByKey.has(key)) {
      keepByKey.add(key);
      return;
    }
    deleteIds.push(id);
  });

  if (deleteIds.length > 0) {
    const { error: deleteCompactedError } = await supabaseAdmin
      .from("facebook_performance_snapshots")
      .delete()
      .in("id", deleteIds);
    if (deleteCompactedError) throw new Error(deleteCompactedError.message);
  }
}

export async function syncUserDashboardMetrics(
  userId: string,
  token: string,
  usdRates?: Record<string, number>
): Promise<DashboardSyncSummary> {
  const rates = usdRates || (await fetchUsdRates());
  const rows = await getUserAdAccounts(userId);
  const reportingTimezone = await getUserReportingTimezone(userId);

  let activeAccountsCount = 0;
  let activeAdsCount = 0;
  let totalLeads = 0;
  const detailRows: DashboardAdAccountMetricRow[] = [];
  const nowIso = new Date().toISOString();
  const sourceDate = formatDateInTimezone(nowIso, reportingTimezone);

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
    const activeCampaignIds = new Set(
      realActiveAds.map((adRow) => adRow.campaign?.id).filter(Boolean) as string[]
    );

    const accountActiveAdsCount = realActiveAds.length;
    const accountActiveCampaignsCount = activeCampaignIds.size;
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
      active_campaigns_count: accountActiveCampaignsCount,
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

  if (detailRows.length > 0) {
    await upsertAdAccountMetricsRows("facebook_dashboard_ad_account_metrics", detailRows as Array<Record<string, unknown>>);
  }
  await applyDailyRetention("facebook_dashboard_ad_account_metrics", userId, nowIso);

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
  await applyTimeseriesRetention("facebook_dashboard_timeseries", userId, nowIso);

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
  const reportingTimezone = await getUserReportingTimezone(userId);
  const connectionId = await getUserConnectionId(userId);
  const manualOverrides = await getManualOverrides(userId);

  let activeAccountsCount = 0;
  let activeAdsCount = 0;
  let totalResults = 0;
  const accountRows: MessagingAdAccountMetricRow[] = [];

  const nowIso = new Date().toISOString();
  const sourceDate = formatDateInTimezone(nowIso, reportingTimezone);

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

    const adsetInsights = await graphFetchPaginated<GraphAdsetInsight>(
      `${GRAPH_BASE_URL}/${accountEdgeId}/insights?fields=adset_id,spend,actions&level=adset&date_preset=today&limit=500&access_token=${encodeURIComponent(token)}`,
      20
    ).catch(() => []);

    const adsetInsightMap = new Map<string, GraphAdsetInsight>();
    adsetInsights.forEach((insightRow) => {
      if (insightRow.adset_id) {
        adsetInsightMap.set(insightRow.adset_id, insightRow);
      }
    });

    let accountSpendOriginal = 0;
    let accountResults = 0;
    let accountActiveAds = 0;
    const accountActiveCampaignIds = new Set<string>();

    for (const adset of adsets) {
      const insightRow = adsetInsightMap.get(adset.id);
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
      const activeAdsForAdset = activeAdsByAdset.get(adset.id) || 0;
      accountActiveAds += activeAdsForAdset;
      if (activeAdsForAdset > 0 && adset.campaign?.id) {
        accountActiveCampaignIds.add(adset.campaign.id);
      }
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
      active_campaigns_count: accountActiveCampaignIds.size,
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

  if (accountRows.length > 0) {
    await upsertAdAccountMetricsRows("facebook_messages_ad_account_metrics", accountRows as Array<Record<string, unknown>>);
  }
  await applyDailyRetention("facebook_messages_ad_account_metrics", userId, nowIso);

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
  await applyTimeseriesRetention("facebook_messages_timeseries", userId, nowIso);

  return {
    userId,
    activeAccountsCount,
    activeAdsCount,
    totalSpendUsd: Number(totalSpendUsd.toFixed(2)),
    totalResults,
    costPerResultUsd,
  };
}

export async function syncUserLeadsMetrics(
  userId: string,
  token: string,
  usdRates?: Record<string, number>
): Promise<DashboardSyncSummary> {
  const rates = usdRates || (await fetchUsdRates());
  const rows = await getUserAdAccounts(userId);
  const reportingTimezone = await getUserReportingTimezone(userId);
  const classifiedLeadAdsets = await getClassifiedAdsetsForUser(userId, "LEADS");

  const leadAdsetsByAccount = new Map<string, Map<string, string | null>>();
  classifiedLeadAdsets.forEach((row) => {
    const accountMap =
      leadAdsetsByAccount.get(row.facebook_ad_account_id) || new Map<string, string | null>();
    accountMap.set(row.facebook_adset_id, row.campaign_id || null);
    leadAdsetsByAccount.set(row.facebook_ad_account_id, accountMap);
  });

  let activeAccountsCount = 0;
  let activeAdsCount = 0;
  let totalLeads = 0;
  const accountRows: LeadsAdAccountMetricRow[] = [];

  const nowIso = new Date().toISOString();
  const sourceDate = formatDateInTimezone(nowIso, reportingTimezone);

  for (const ad of rows) {
    const accountEdgeId = ad.facebook_ad_account_id.startsWith("act_")
      ? ad.facebook_ad_account_id
      : `act_${ad.account_id || ad.facebook_ad_account_id}`;

    const leadAdsetMap = leadAdsetsByAccount.get(ad.facebook_ad_account_id) || new Map<string, string | null>();
    if (leadAdsetMap.size === 0) continue;

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

    const adsetInsights = await graphFetchPaginated<GraphAdsetInsight>(
      `${GRAPH_BASE_URL}/${accountEdgeId}/insights?fields=adset_id,spend,actions&level=adset&date_preset=today&limit=500&access_token=${encodeURIComponent(token)}`,
      20
    ).catch(() => []);

    let accountSpendOriginal = 0;
    let accountLeads = 0;
    let accountActiveAds = 0;
    const accountActiveCampaignIds = new Set<string>();

    for (const insightRow of adsetInsights) {
      const adsetId = insightRow.adset_id;
      if (!adsetId || !leadAdsetMap.has(adsetId)) continue;

      accountSpendOriginal += Number(insightRow.spend || 0);
      accountLeads += parseLeadCount(insightRow.actions);

      const activeAdsForAdset = activeAdsByAdset.get(adsetId) || 0;
      accountActiveAds += activeAdsForAdset;

      const campaignId = leadAdsetMap.get(adsetId);
      if (activeAdsForAdset > 0 && campaignId) {
        accountActiveCampaignIds.add(campaignId);
      }
    }

    const accountSpendUsd = convertToUsd(accountSpendOriginal, ad.currency, rates);
    const accountCostPerResult =
      accountLeads > 0 ? Number((accountSpendUsd / accountLeads).toFixed(2)) : null;
    const isActiveAccount = accountActiveAds > 0;

    if (accountSpendOriginal <= 0 && accountLeads <= 0 && accountActiveAds <= 0) {
      continue;
    }

    if (isActiveAccount) {
      activeAccountsCount += 1;
      activeAdsCount += accountActiveAds;
    }

    totalLeads += accountLeads;

    accountRows.push({
      user_id: userId,
      facebook_ad_account_id: ad.facebook_ad_account_id,
      account_id: ad.account_id || null,
      account_name: ad.name || null,
      active_campaigns_count: accountActiveCampaignIds.size,
      active_ads_count: accountActiveAds,
      is_active_account: isActiveAccount,
      account_status: accountStatus,
      spend_original: Number(accountSpendOriginal.toFixed(2)),
      currency: ad.currency || null,
      spend_usd: Number(accountSpendUsd.toFixed(2)),
      leads_count: accountLeads,
      cost_per_result_usd: accountCostPerResult,
      source_date: sourceDate,
      last_synced_at: nowIso,
    });
  }

  const totalSpendUsd = accountRows.reduce((sum, row) => sum + row.spend_usd, 0);
  const costPerResultUsd = totalLeads > 0 ? Number((totalSpendUsd / totalLeads).toFixed(2)) : null;

  if (accountRows.length > 0) {
    await upsertAdAccountMetricsRows("facebook_leads_ad_account_metrics", accountRows as Array<Record<string, unknown>>);
  }
  await applyDailyRetention("facebook_leads_ad_account_metrics", userId, nowIso);

  const { error: summaryUpsertError } = await supabaseAdmin.from("facebook_leads_metrics").upsert(
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
  if (summaryUpsertError) throw new Error(summaryUpsertError.message);

  const { error: seriesError } = await supabaseAdmin.from("facebook_leads_timeseries").upsert(
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
  await applyTimeseriesRetention("facebook_leads_timeseries", userId, nowIso);

  return {
    userId,
    activeAccountsCount,
    activeAdsCount,
    totalSpendUsd: Number(totalSpendUsd.toFixed(2)),
    totalLeads,
    costPerResultUsd,
  };
}

export async function syncUserBrandingMetrics(
  userId: string,
  token: string,
  usdRates?: Record<string, number>
): Promise<BrandingSyncSummary> {
  const rates = usdRates || (await fetchUsdRates());
  const rows = await getUserAdAccounts(userId);
  const reportingTimezone = await getUserReportingTimezone(userId);
  const classifiedBrandingAdsets = await getClassifiedAdsetsForUser(userId, "AWARENESS");

  const brandingAdsetsByAccount = new Map<string, Map<string, string | null>>();
  classifiedBrandingAdsets.forEach((row) => {
    const accountMap =
      brandingAdsetsByAccount.get(row.facebook_ad_account_id) || new Map<string, string | null>();
    accountMap.set(row.facebook_adset_id, row.campaign_id || null);
    brandingAdsetsByAccount.set(row.facebook_ad_account_id, accountMap);
  });

  let activeAccountsCount = 0;
  let activeAdsCount = 0;
  let totalResults = 0;
  const accountRows: BrandingAdAccountMetricRow[] = [];

  const nowIso = new Date().toISOString();
  const sourceDate = formatDateInTimezone(nowIso, reportingTimezone);

  for (const ad of rows) {
    const accountEdgeId = ad.facebook_ad_account_id.startsWith("act_")
      ? ad.facebook_ad_account_id
      : `act_${ad.account_id || ad.facebook_ad_account_id}`;

    const brandingAdsetMap =
      brandingAdsetsByAccount.get(ad.facebook_ad_account_id) || new Map<string, string | null>();
    if (brandingAdsetMap.size === 0) continue;

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

    const adsetInsights = await graphFetchPaginated<GraphAdsetInsight>(
      `${GRAPH_BASE_URL}/${accountEdgeId}/insights?fields=adset_id,spend,actions&level=adset&date_preset=today&limit=500&access_token=${encodeURIComponent(token)}`,
      20
    ).catch(() => []);

    let accountSpendOriginal = 0;
    let accountResults = 0;
    let accountActiveAds = 0;
    const accountActiveCampaignIds = new Set<string>();

    for (const insightRow of adsetInsights) {
      const adsetId = insightRow.adset_id;
      if (!adsetId || !brandingAdsetMap.has(adsetId)) continue;

      accountSpendOriginal += Number(insightRow.spend || 0);
      accountResults += parseBrandingResultCount(insightRow.actions);

      const activeAdsForAdset = activeAdsByAdset.get(adsetId) || 0;
      accountActiveAds += activeAdsForAdset;

      const campaignId = brandingAdsetMap.get(adsetId);
      if (activeAdsForAdset > 0 && campaignId) {
        accountActiveCampaignIds.add(campaignId);
      }
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
      active_campaigns_count: accountActiveCampaignIds.size,
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

  if (accountRows.length > 0) {
    await upsertAdAccountMetricsRows("facebook_branding_ad_account_metrics", accountRows as Array<Record<string, unknown>>);
  }
  await applyDailyRetention("facebook_branding_ad_account_metrics", userId, nowIso);

  const { error: summaryUpsertError } = await supabaseAdmin.from("facebook_branding_metrics").upsert(
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

  const { error: seriesError } = await supabaseAdmin.from("facebook_branding_timeseries").upsert(
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
  await applyTimeseriesRetention("facebook_branding_timeseries", userId, nowIso);

  return {
    userId,
    activeAccountsCount,
    activeAdsCount,
    totalSpendUsd: Number(totalSpendUsd.toFixed(2)),
    totalResults,
    costPerResultUsd,
  };
}

export async function syncUserSalesMetrics(
  userId: string,
  token: string,
  usdRates?: Record<string, number>
): Promise<BrandingSyncSummary> {
  const rates = usdRates || (await fetchUsdRates());
  const rows = await getUserAdAccounts(userId);
  const reportingTimezone = await getUserReportingTimezone(userId);
  const classifiedSalesAdsets = await getClassifiedAdsetsForUser(userId, "SALES");

  const salesAdsetsByAccount = new Map<string, Map<string, string | null>>();
  classifiedSalesAdsets.forEach((row) => {
    const accountMap =
      salesAdsetsByAccount.get(row.facebook_ad_account_id) || new Map<string, string | null>();
    accountMap.set(row.facebook_adset_id, row.campaign_id || null);
    salesAdsetsByAccount.set(row.facebook_ad_account_id, accountMap);
  });

  let activeAccountsCount = 0;
  let activeAdsCount = 0;
  let totalResults = 0;
  const accountRows: SalesAdAccountMetricRow[] = [];

  const nowIso = new Date().toISOString();
  const sourceDate = formatDateInTimezone(nowIso, reportingTimezone);

  for (const ad of rows) {
    const accountEdgeId = ad.facebook_ad_account_id.startsWith("act_")
      ? ad.facebook_ad_account_id
      : `act_${ad.account_id || ad.facebook_ad_account_id}`;

    const salesAdsetMap =
      salesAdsetsByAccount.get(ad.facebook_ad_account_id) || new Map<string, string | null>();
    if (salesAdsetMap.size === 0) continue;

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

    const accountAdsets = await graphFetchPaginated<GraphAdset>(
      `${GRAPH_BASE_URL}/${accountEdgeId}/adsets?fields=id,optimization_goal,destination_type,campaign{id,objective}&limit=500&access_token=${encodeURIComponent(token)}`,
      20
    ).catch(() => []);
    const adsetMetaMap = new Map(accountAdsets.map((item) => [item.id, item]));

    const adsetInsights = await graphFetchPaginated<GraphAdsetInsight>(
      `${GRAPH_BASE_URL}/${accountEdgeId}/insights?fields=adset_id,spend,actions&level=adset&date_preset=today&limit=500&access_token=${encodeURIComponent(token)}`,
      20
    ).catch(() => []);

    let accountSpendOriginal = 0;
    let accountResults = 0;
    let accountActiveAds = 0;
    const accountActiveCampaignIds = new Set<string>();

    for (const insightRow of adsetInsights) {
      const adsetId = insightRow.adset_id;
      if (!adsetId || !salesAdsetMap.has(adsetId)) continue;

      const adsetMeta = adsetMetaMap.get(adsetId);
      const destinationType = (adsetMeta?.destination_type || "").toUpperCase();
      const optimizationGoal = (adsetMeta?.optimization_goal || "").toUpperCase();
      const campaignObjective = (adsetMeta?.campaign?.objective || "").toUpperCase();
      const isMessagingDestination =
        destinationType.includes("WHATSAPP") ||
        destinationType.includes("MESSENGER") ||
        destinationType.includes("INSTAGRAM_DIRECT") ||
        destinationType.includes("CLICK_TO_MESSAGE");
      const isSalesObjective =
        campaignObjective.includes("SALES") || campaignObjective.includes("OUTCOME_SALES");
      const isSalesOptimization =
        optimizationGoal === "OFFSITE_CONVERSIONS" ||
        optimizationGoal === "PURCHASE" ||
        optimizationGoal === "VALUE";

      // Sales tab = web/catalog sales only (exclude messaging destinations).
      if (isMessagingDestination || (!isSalesObjective && !isSalesOptimization)) continue;

      accountSpendOriginal += Number(insightRow.spend || 0);
      accountResults += parseSalesResultCount(insightRow.actions);

      const activeAdsForAdset = activeAdsByAdset.get(adsetId) || 0;
      accountActiveAds += activeAdsForAdset;

      const campaignId = salesAdsetMap.get(adsetId);
      if (activeAdsForAdset > 0 && campaignId) {
        accountActiveCampaignIds.add(campaignId);
      }
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
      active_campaigns_count: accountActiveCampaignIds.size,
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

  if (accountRows.length > 0) {
    await upsertAdAccountMetricsRows("facebook_sales_ad_account_metrics", accountRows as Array<Record<string, unknown>>);
  }
  await applyDailyRetention("facebook_sales_ad_account_metrics", userId, nowIso);

  const { error: summaryUpsertError } = await supabaseAdmin.from("facebook_sales_metrics").upsert(
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

  const { error: seriesError } = await supabaseAdmin.from("facebook_sales_timeseries").upsert(
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
  await applyTimeseriesRetention("facebook_sales_timeseries", userId, nowIso);

  return {
    userId,
    activeAccountsCount,
    activeAdsCount,
    totalSpendUsd: Number(totalSpendUsd.toFixed(2)),
    totalResults,
    costPerResultUsd,
  };
}

export async function syncUserPerformanceMonitoring(
  userId: string,
  token: string,
  usdRates?: Record<string, number>
): Promise<{ userId: string; entitiesTracked: number }> {
  const rates = usdRates || (await fetchUsdRates());
  const rows = await getUserAdAccounts(userId);
  const reportingTimezone = await getUserReportingTimezone(userId);
  const nowIso = new Date().toISOString();
  const sourceDate = formatDateInTimezone(nowIso, reportingTimezone);
  const snapshotTime = getRoundedSnapshotTime(nowIso);

  const { data: previousStateRows, error: previousStateError } = await supabaseAdmin
    .from("facebook_performance_state")
    .select("entity_type,entity_id,cost_per_result_usd,results_count")
    .eq("user_id", userId);
  if (previousStateError) throw new Error(previousStateError.message);

  const previousStateMap = new Map<
    string,
    { cost_per_result_usd: number | null; results_count: number | null }
  >();
  (previousStateRows || []).forEach((row) => {
    const key = `${row.entity_type as string}:${row.entity_id as string}`;
    previousStateMap.set(key, {
      cost_per_result_usd: (row.cost_per_result_usd as number | null) ?? null,
      results_count: (row.results_count as number | null) ?? null,
    });
  });

  const snapshotRows: Array<Record<string, unknown>> = [];
  const stateRows: Array<Record<string, unknown>> = [];

  for (const ad of rows) {
    const accountEdgeId = ad.facebook_ad_account_id.startsWith("act_")
      ? ad.facebook_ad_account_id
      : `act_${ad.account_id || ad.facebook_ad_account_id}`;

    const accountMeta = await fetchJson<{ account_status?: number }>(
      `${GRAPH_BASE_URL}/${accountEdgeId}?fields=account_status&access_token=${encodeURIComponent(token)}`
    ).catch((): { account_status?: number } => ({}));
    const accountEffectiveStatus = accountMeta.account_status === 1 ? "ACTIVE" : "INACTIVE";

    const campaignStatuses = await graphFetchPaginated<GraphCampaign>(
      `${GRAPH_BASE_URL}/${accountEdgeId}/campaigns?fields=id,status,effective_status&limit=500&access_token=${encodeURIComponent(token)}`,
      20
    ).catch(() => []);
    const adsetStatuses = await graphFetchPaginated<GraphAdset>(
      `${GRAPH_BASE_URL}/${accountEdgeId}/adsets?fields=id,status,effective_status&limit=500&access_token=${encodeURIComponent(token)}`,
      20
    ).catch(() => []);
    const adStatuses = await graphFetchPaginated<GraphAdStatus>(
      `${GRAPH_BASE_URL}/${accountEdgeId}/ads?fields=id,status,effective_status&limit=500&access_token=${encodeURIComponent(token)}`,
      20
    ).catch(() => []);

    const campaignStatusMap = new Map(campaignStatuses.map((item) => [item.id, item]));
    const adsetStatusMap = new Map(adsetStatuses.map((item) => [item.id, item]));
    const adStatusMap = new Map(adStatuses.map((item) => [item.id, item]));

    const levels: Array<"account" | "campaign" | "adset" | "ad"> = ["account", "campaign", "adset", "ad"];

    for (const level of levels) {
      const insights = await graphFetchPaginated<GraphInsight>(
        `${GRAPH_BASE_URL}/${accountEdgeId}/insights?fields=campaign_id,campaign_name,adset_id,adset_name,ad_id,ad_name,spend,actions,impressions,clicks,ctr,cpm,frequency&level=${level}&date_preset=today&limit=500&access_token=${encodeURIComponent(token)}`,
        20
      ).catch(() => []);

      for (const insightRow of insights) {
        const entityId =
          level === "account"
            ? ad.facebook_ad_account_id
            : level === "campaign"
            ? insightRow.campaign_id
            : level === "adset"
              ? insightRow.adset_id
              : insightRow.ad_id;
        const entityName =
          level === "account"
            ? ad.name
            : level === "campaign"
            ? insightRow.campaign_name
            : level === "adset"
              ? insightRow.adset_name
              : insightRow.ad_name;

        if (!entityId) continue;

        const spendOriginal = Number(insightRow.spend || 0);
        const spendUsd = convertToUsd(spendOriginal, ad.currency, rates);
        const resultsCount = parseUnifiedResultCount(insightRow.actions);
        const clicks = Number(insightRow.clicks || 0);
        const cpcUsd = getCpcUsd(spendUsd, clicks);
        const costPerResultUsd =
          resultsCount > 0 ? Number((spendUsd / resultsCount).toFixed(2)) : null;

        const prevKey = `${level}:${entityId}`;
        const prev = previousStateMap.get(prevKey);
        const trend = getTrend(
          costPerResultUsd,
          resultsCount,
          prev?.cost_per_result_usd ?? null,
          prev?.results_count ?? null
        );
        const health = getHealth(spendUsd, resultsCount, costPerResultUsd, trend);

        const statusSource =
          level === "account"
            ? null
            : level === "campaign"
            ? campaignStatusMap.get(entityId)
            : level === "adset"
              ? adsetStatusMap.get(entityId)
              : adStatusMap.get(entityId);

        const configuredStatus = level === "account" ? accountEffectiveStatus : statusSource?.status || null;
        const effectiveStatus = level === "account" ? accountEffectiveStatus : statusSource?.effective_status || null;

        const ruleDecision = getRuleBasedAiRecommendation({
          trend,
          health,
          resultsCount,
          costPerResultUsd,
          cpm: insightRow.cpm != null ? Number(insightRow.cpm) : null,
          ctr: insightRow.ctr != null ? Number(insightRow.ctr) : null,
          cpcUsd,
        });

        const rowBase = {
          user_id: userId,
          facebook_ad_account_id: ad.facebook_ad_account_id,
          account_id: ad.account_id || null,
          account_name: ad.name || null,
          entity_type: level,
          entity_id: entityId,
          entity_name: entityName || null,
          campaign_id: insightRow.campaign_id || null,
          campaign_name: insightRow.campaign_name || null,
          adset_id: insightRow.adset_id || null,
          adset_name: insightRow.adset_name || null,
          ad_id: insightRow.ad_id || null,
          ad_name: insightRow.ad_name || null,
          configured_status: configuredStatus,
          effective_status: effectiveStatus,
          spend_original: Number(spendOriginal.toFixed(2)),
          currency: ad.currency || null,
          spend_usd: Number(spendUsd.toFixed(2)),
          results_count: resultsCount,
          cost_per_result_usd: costPerResultUsd,
          impressions: Number(insightRow.impressions || 0),
          clicks,
          ctr: insightRow.ctr != null ? Number(insightRow.ctr) : null,
          cpm: insightRow.cpm != null ? Number(insightRow.cpm) : null,
          cpc_usd: cpcUsd,
          frequency: insightRow.frequency != null ? Number(insightRow.frequency) : null,
          trend,
          health,
          ai_recommendation: ruleDecision.recommendation,
          ai_reason_short: normalizeAiReasonShort(ruleDecision.reason),
          ai_confidence_score: 50,
          ai_feature_summary: null as string | null,
          ai_action: ruleDecision.recommendation === "scale" ? "scale_up" : "none",
          ai_analyzed_at: nowIso,
          ai_model: "rule",
          source_date: sourceDate,
          last_synced_at: nowIso,
        };

        snapshotRows.push({
          ...rowBase,
          snapshot_time: snapshotTime,
        });

        stateRows.push({
          ...rowBase,
          updated_at: nowIso,
        });
      }
    }
  }

  const featureMap = await getTodayFeatureMap(userId, sourceDate, stateRows);
  const applyFeatures = (row: Record<string, unknown>) => {
    const key = `${row.entity_type as string}:${row.entity_id as string}`;
    const feature = featureMap.get(key);
    row.ai_confidence_score = getRuleConfidence(row, feature);
    row.ai_feature_summary = feature?.summary || null;
  };
  stateRows.forEach(applyFeatures);
  snapshotRows.forEach(applyFeatures);

  const aiSlotIso = getAiSlotIso(nowIso);
  const shouldRunAi = await acquireAiRunSlot(userId, aiSlotIso);
  const totalEntities = stateRows.length;
  let openAiAnalyzedCount = 0;
  let openAiModelUsed: string | null = null;

  // Do not overwrite telemetry status when slot is already processed.
  // Otherwise UI can show "idle" right after a successful run in the same slot.
  if (!shouldRunAi) {
    await updateAiRunTelemetry(userId, {
      last_slot_at: aiSlotIso,
      last_total_entities: totalEntities,
    });
  }

  if (shouldRunAi) {
    await updateAiRunTelemetry(userId, {
      last_ai_run_at: nowIso,
      last_slot_at: aiSlotIso,
      last_status: "running",
      last_error: null,
      last_total_entities: totalEntities,
      last_openai_entities: 0,
      last_model: "rule",
    });

    const openAiKey = await getUserOpenAiApiKey(userId);
    if (openAiKey && stateRows.length > 0) {
      try {
        const candidateRows = stateRows
          .filter((row) => {
            const key = `${row.entity_type as string}:${row.entity_id as string}`;
            return shouldAnalyzeWithOpenAi(row, previousStateMap.get(key), featureMap.get(key));
          })
          .sort((a, b) => Number(b.spend_usd || 0) - Number(a.spend_usd || 0))
          .slice(0, 120);

        const aiInputRows: AiRowInput[] = candidateRows.map((row) => ({
          key: `${row.entity_type as string}:${row.entity_id as string}`,
          entity_type: row.entity_type as string,
          entity_id: row.entity_id as string,
          spend_usd: Number(row.spend_usd || 0),
          results_count: Number(row.results_count || 0),
          cost_per_result_usd: row.cost_per_result_usd == null ? null : Number(row.cost_per_result_usd),
          cpm: row.cpm == null ? null : Number(row.cpm),
          ctr: row.ctr == null ? null : Number(row.ctr),
          cpc_usd: row.cpc_usd == null ? null : Number(row.cpc_usd),
          trend: row.trend as MonitoringTrend,
          health: row.health as MonitoringHealth,
          feature: featureMap.get(`${row.entity_type as string}:${row.entity_id as string}`) || null,
        }));

        const aiMap = aiInputRows.length > 0 ? await getOpenAiRecommendations(openAiKey, aiInputRows) : new Map();
        openAiAnalyzedCount = aiInputRows.length;
        openAiModelUsed = process.env.OPENAI_MODEL || "gpt-4o-mini";
        const applyAi = (row: Record<string, unknown>) => {
          const key = `${row.entity_type as string}:${row.entity_id as string}`;
          const ai = aiMap.get(key);
          if (!ai) return;
          row.ai_recommendation = ai.recommendation;
          row.ai_reason_short = normalizeAiReasonShort(ai.reason);
          row.ai_confidence_score = ai.confidence;
          row.ai_feature_summary =
            featureMap.get(`${row.entity_type as string}:${row.entity_id as string}`)?.summary || null;
          row.ai_analyzed_at = nowIso;
          row.ai_model = openAiModelUsed;
        };

        stateRows.forEach(applyAi);
        snapshotRows.forEach(applyAi);

        await updateAiRunTelemetry(userId, {
          last_ai_run_at: nowIso,
          last_slot_at: aiSlotIso,
          last_status: aiInputRows.length > 0 ? "completed" : "skipped",
          last_error: aiInputRows.length > 0 ? null : "No candidates for OpenAI",
          last_openai_entities: openAiAnalyzedCount,
          last_total_entities: totalEntities,
          last_model: aiInputRows.length > 0 ? openAiModelUsed : "rule",
        });
      } catch (aiError) {
        console.error("[facebook-metrics] ai recommendations fallback to rules", {
          userId,
          message: aiError instanceof Error ? aiError.message : "unknown ai error",
        });
        await updateAiRunTelemetry(userId, {
          last_ai_run_at: nowIso,
          last_slot_at: aiSlotIso,
          last_status: "error",
          last_error: aiError instanceof Error ? aiError.message.slice(0, 240) : "Unknown OpenAI error",
          last_openai_entities: openAiAnalyzedCount,
          last_total_entities: totalEntities,
          last_model: "rule",
        });
      }
    } else {
      await updateAiRunTelemetry(userId, {
        last_ai_run_at: nowIso,
        last_slot_at: aiSlotIso,
        last_status: "skipped",
        last_error: openAiKey ? "No entities to analyze" : "OpenAI key not configured",
        last_openai_entities: 0,
        last_total_entities: totalEntities,
        last_model: "rule",
      });
    }
  }

  deriveAccountAiFromCampaigns(stateRows);
  deriveAccountAiFromCampaigns(snapshotRows);
  applyHierarchicalAiActions(stateRows);
  applyHierarchicalAiActions(snapshotRows);

  if (snapshotRows.length > 0) {
    const { error: snapshotError } = await supabaseAdmin
      .from("facebook_performance_snapshots")
      .upsert(snapshotRows, { onConflict: "user_id,entity_type,entity_id,snapshot_time" });
    if (snapshotError) throw new Error(snapshotError.message);
  }
  await applyPerformanceSnapshotRetention(userId, nowIso);

  const { error: stateDeleteError } = await supabaseAdmin
    .from("facebook_performance_state")
    .delete()
    .eq("user_id", userId);
  if (stateDeleteError) throw new Error(stateDeleteError.message);

  if (stateRows.length > 0) {
    const { error: stateInsertError } = await supabaseAdmin
      .from("facebook_performance_state")
      .insert(stateRows);
    if (stateInsertError) throw new Error(stateInsertError.message);
  }

  return { userId, entitiesTracked: stateRows.length };
}

export async function syncUserAllMetrics(
  userId: string,
  token: string,
  usdRates?: Record<string, number>
): Promise<UserSyncSummary> {
  const rates = usdRates || (await fetchUsdRates());
  const dashboard = await syncUserDashboardMetrics(userId, token, rates);
  const messaging = await syncUserMessagingMetrics(userId, token, rates);
  const leads = await syncUserLeadsMetrics(userId, token, rates);
  const branding = await syncUserBrandingMetrics(userId, token, rates);
  const sales = await syncUserSalesMetrics(userId, token, rates);
  const monitoring = await syncUserPerformanceMonitoring(userId, token, rates);
  return { dashboard, messaging, leads, branding, sales, monitoring };
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
