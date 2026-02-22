"use client";

import { useEffect, useMemo, useState, type MouseEvent as ReactMouseEvent } from "react";
import { supabase } from "../lib/supabaseClient";

type RangeKey = "today" | "yesterday" | "3d" | "7d";
type XMode = "hour" | "day";

type RawAccountRow = {
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
  source_date: string;
  cost_per_result_usd: number | null;
};

type AggregatedAccountRow = Omit<RawAccountRow, "source_date"> & {
  result_count: number;
};

type RawSeriesRow = {
  snapshot_time: string;
  source_date: string;
  spend_usd: number;
  cost_per_result_usd: number | null;
};

type SeriesPoint = {
  snapshot_time: string;
  source_date: string;
  spend_usd: number;
  result_count: number;
  cost_per_result_usd: number | null;
};

type ChartTooltip = {
  x: number;
  y: number;
  markerX: number;
  markerY: number;
  markerColor: string;
  metric: "spend" | "results" | "cpr";
  label: string;
  spendUsd: number;
  results: number;
  cpr: number | null;
};

type SummaryStats = {
  activeAccountsCount: number;
  activeAdsCount: number;
  totalSpendUsd: number;
  totalResults: number;
  costPerResultUsd: number | null;
  lastSyncedAt: string | null;
};

type Props = {
  title: string;
  subtitle: string;
  resultTerm: string;
  resultSubtitle: string;
  syncScopeSubtitle: string;
  metricsTable: string;
  summaryResultField: string;
  accountTable: string;
  accountResultField: string;
  timeseriesTable: string;
  timeseriesResultField: string;
  onlyRunningAccounts?: boolean;
  tooltipResultsLabel?: string;
  chartCurrencySymbol?: string;
};

const RANGE_OPTIONS: Array<{ key: RangeKey; label: string }> = [
  { key: "today", label: "Hoy" },
  { key: "yesterday", label: "Ayer" },
  { key: "3d", label: "3 dias" },
  { key: "7d", label: "7 dias" },
];

function formatDateParts(date: Date) {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getDateInTimeZone(date: Date, timeZone: string) {
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

function dateOnlyToUtcDate(dateOnly: string) {
  return new Date(`${dateOnly}T00:00:00.000Z`);
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function buildRange(range: RangeKey, timeZone: string) {
  const now = new Date();
  const todayInTz = getDateInTimeZone(now, timeZone);
  const todayStart = dateOnlyToUtcDate(todayInTz);

  let start = todayStart;
  let endExclusive = addDays(todayStart, 1);

  if (range === "yesterday") {
    start = addDays(todayStart, -1);
    endExclusive = todayStart;
  }
  if (range === "3d") {
    start = addDays(todayStart, -2);
    endExclusive = addDays(todayStart, 1);
  }
  if (range === "7d") {
    start = addDays(todayStart, -6);
    endExclusive = addDays(todayStart, 1);
  }

  return {
    startDate: formatDateParts(start),
    endDate: formatDateParts(addDays(endExclusive, -1)),
    xMode: range === "today" || range === "yesterday" ? ("hour" as XMode) : ("day" as XMode),
  };
}

export default function PerformanceCategoryPage(props: Props) {
  const [range, setRange] = useState<RangeKey>("today");
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [summary, setSummary] = useState<SummaryStats | null>(null);
  const [accountRows, setAccountRows] = useState<AggregatedAccountRow[]>([]);
  const [series, setSeries] = useState<SeriesPoint[]>([]);
  const [tooltip, setTooltip] = useState<ChartTooltip | null>(null);
  const [timezoneName, setTimezoneName] = useState("America/Lima");

  const rangeInfo = useMemo(() => buildRange(range, timezoneName), [range, timezoneName]);

  const loadMetrics = async () => {
    setLoading(true);
    setError(null);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setError("No se pudo validar la sesion.");
      setLoading(false);
      return;
    }

    const { data: profileRow } = await supabase
      .from("profiles")
      .select("timezone_name")
      .eq("id", user.id)
      .maybeSingle();
    const tz = (profileRow?.timezone_name as string | null) || "America/Lima";
    setTimezoneName(tz);

    const fetchRangeData = async (startDate: string, endDate: string) =>
      Promise.all([
        supabase
          .from(props.accountTable)
          .select(
            `facebook_ad_account_id,account_id,account_name,active_campaigns_count,active_ads_count,is_active_account,account_status,spend_original,currency,spend_usd,source_date,cost_per_result_usd,${props.accountResultField}`
          )
          .eq("user_id", user.id)
          .gte("source_date", startDate)
          .lte("source_date", endDate)
          .order("source_date", { ascending: false }),
        supabase
          .from(props.timeseriesTable)
          .select(`snapshot_time,source_date,spend_usd,cost_per_result_usd,${props.timeseriesResultField}`)
          .eq("user_id", user.id)
          .gte("source_date", startDate)
          .lte("source_date", endDate)
          .order("snapshot_time", { ascending: true }),
      ]);

    const [metricsRes, accountsResInitial, seriesResInitial] = await Promise.all([
      supabase
        .from(props.metricsTable)
        .select(`last_synced_at,${props.summaryResultField}`)
        .eq("user_id", user.id)
        .maybeSingle(),
      ...await fetchRangeData(rangeInfo.startDate, rangeInfo.endDate),
    ]);

    if (metricsRes.error) {
      setError(metricsRes.error.message);
      setLoading(false);
      return;
    }
    if (accountsResInitial.error) {
      setError(accountsResInitial.error.message);
      setLoading(false);
      return;
    }
    if (seriesResInitial.error) {
      setError(seriesResInitial.error.message);
      setLoading(false);
      return;
    }

    let accountsRes = accountsResInitial;
    let seriesRes = seriesResInitial;

    // Fallback for timezone/date-boundary gaps:
    // if "today" has no rows, use latest available source_date.
    if (
      range === "today" &&
      ((accountsRes.data || []).length === 0 || (seriesRes.data || []).length === 0)
    ) {
      const { data: latestRow, error: latestError } = await supabase
        .from(props.accountTable)
        .select("source_date")
        .eq("user_id", user.id)
        .order("source_date", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!latestError && latestRow?.source_date) {
        const [fallbackAccounts, fallbackSeries] = await fetchRangeData(
          latestRow.source_date as string,
          latestRow.source_date as string
        );
        if (!fallbackAccounts.error && !fallbackSeries.error) {
          accountsRes = fallbackAccounts;
          seriesRes = fallbackSeries;
        }
      }
    }

    const rawAccounts = ((accountsRes.data as unknown as RawAccountRow[]) || []).map(
      (row): RawAccountRow => ({
        ...row,
        spend_original: Number(row.spend_original || 0),
        spend_usd: Number(row.spend_usd || 0),
        active_ads_count: Number(row.active_ads_count || 0),
        active_campaigns_count: Number(row.active_campaigns_count || 0),
      })
    );

    const aggregatedMap = new Map<string, AggregatedAccountRow>();
    rawAccounts.forEach((row) => {
      const currentResult = Number((row as Record<string, unknown>)[props.accountResultField] || 0);
      const existing = aggregatedMap.get(row.facebook_ad_account_id);

      if (!existing) {
        aggregatedMap.set(row.facebook_ad_account_id, {
          facebook_ad_account_id: row.facebook_ad_account_id,
          account_id: row.account_id || null,
          account_name: row.account_name || null,
          active_campaigns_count: row.active_campaigns_count,
          active_ads_count: row.active_ads_count,
          is_active_account: Boolean(row.is_active_account),
          account_status: row.account_status ?? null,
          spend_original: row.spend_original,
          currency: row.currency || null,
          spend_usd: row.spend_usd,
          cost_per_result_usd: row.cost_per_result_usd != null ? Number(row.cost_per_result_usd) : null,
          result_count: currentResult,
        });
        return;
      }

      existing.spend_original += row.spend_original;
      existing.spend_usd += row.spend_usd;
      existing.result_count += currentResult;
      existing.active_ads_count = Math.max(existing.active_ads_count, row.active_ads_count);
      existing.active_campaigns_count = Math.max(existing.active_campaigns_count, row.active_campaigns_count);
      existing.is_active_account = existing.is_active_account || Boolean(row.is_active_account);
      if (existing.result_count > 0) {
        existing.cost_per_result_usd = Number((existing.spend_usd / existing.result_count).toFixed(2));
      }
    });

    let aggregatedAccounts = Array.from(aggregatedMap.values()).sort((a, b) => b.spend_usd - a.spend_usd);
    if (props.onlyRunningAccounts) {
      aggregatedAccounts = aggregatedAccounts.filter((row) => row.active_ads_count > 0);
    }

    const rawSeries = ((seriesRes.data as unknown as RawSeriesRow[]) || []).map((row) => ({
      snapshot_time: row.snapshot_time,
      source_date: row.source_date,
      spend_usd: Number(row.spend_usd || 0),
      result_count: Number((row as Record<string, unknown>)[props.timeseriesResultField] || 0),
      cost_per_result_usd: row.cost_per_result_usd != null ? Number(row.cost_per_result_usd) : null,
    }));

    let normalizedSeries: SeriesPoint[] = rawSeries;
    if (rangeInfo.xMode === "day") {
      const latestByDay = new Map<string, SeriesPoint>();
      rawSeries.forEach((point) => {
        latestByDay.set(point.source_date, point);
      });
      normalizedSeries = Array.from(latestByDay.values()).sort(
        (a, b) => new Date(a.snapshot_time).getTime() - new Date(b.snapshot_time).getTime()
      );
    }

    const totalSpendUsd = aggregatedAccounts.reduce((sum, row) => sum + row.spend_usd, 0);
    const totalResults = aggregatedAccounts.reduce((sum, row) => sum + row.result_count, 0);
    const activeAccountsCount = aggregatedAccounts.filter((row) => row.is_active_account).length;
    const activeAdsCount = aggregatedAccounts.reduce((sum, row) => sum + row.active_ads_count, 0);
    const costPerResultUsd = totalResults > 0 ? Number((totalSpendUsd / totalResults).toFixed(2)) : null;

    setSummary({
      activeAccountsCount,
      activeAdsCount,
      totalSpendUsd: Number(totalSpendUsd.toFixed(2)),
      totalResults,
      costPerResultUsd,
      lastSyncedAt: (metricsRes.data as { last_synced_at?: string } | null)?.last_synced_at || null,
    });
    setAccountRows(aggregatedAccounts);
    setSeries(normalizedSeries);
    setLoading(false);
  };

  useEffect(() => {
    void loadMetrics();
  }, [range, timezoneName]);

  const handleSyncNow = async () => {
    if (range !== "today") return;
    setSyncing(true);
    setError(null);
    setNotice(null);

    try {
      const response = await fetch("/api/facebook/metrics/sync", { method: "POST" });
      const payload = (await response.json().catch(() => ({}))) as {
        error?: string;
        ok?: boolean;
      };
      if (!response.ok || !payload.ok) {
        throw new Error(payload.error || "No se pudo sincronizar.");
      }
      setNotice("Sincronizacion ejecutada correctamente.");
      await loadMetrics();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "No se pudo sincronizar.");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <main className="px-4 py-8 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#111827] sm:text-4xl">{props.title}</h1>
            <p className="mt-2 text-base text-slate-600">{props.subtitle}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {RANGE_OPTIONS.map((option) => (
              <button
                key={option.key}
                type="button"
                onClick={() => setRange(option.key)}
                className={`rounded-lg px-3 py-2 text-sm font-semibold ${
                  range === option.key
                    ? "bg-[#1D293D] text-white"
                    : "border border-slate-200 bg-white text-slate-700"
                }`}
              >
                {option.label}
              </button>
            ))}
            <button
              type="button"
              onClick={handleSyncNow}
              disabled={syncing || range !== "today"}
              className="inline-flex items-center justify-center rounded-lg bg-[#1D293D] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {syncing ? "Sincronizando..." : "Sincronizar ahora"}
            </button>
          </div>
        </header>

        {range !== "today" ? (
          <p className="mt-2 text-xs text-slate-500">
            {props.syncScopeSubtitle} La sincronizacion manual solo aplica para Hoy.
          </p>
        ) : null}

        {error && (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}
        {notice && (
          <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {notice}
          </div>
        )}

        <section className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <MetricCard
            title="Cuentas activas"
            value={summary?.activeAccountsCount ?? 0}
            subtitle={props.syncScopeSubtitle}
          />
          <MetricCard
            title="Gasto total (USD)"
            value={formatUsd(summary?.totalSpendUsd ?? 0)}
            subtitle={`Rango: ${RANGE_OPTIONS.find((o) => o.key === range)?.label}`}
          />
          <MetricCard
            title={
              props.resultTerm.toLowerCase() === "resultados"
                ? "Resultados"
                : `Resultados (${props.resultTerm.toLowerCase()})`
            }
            value={summary?.totalResults ?? 0}
            subtitle={props.resultSubtitle}
          />
          <MetricCard
            title="Costo por resultado"
            value={summary?.costPerResultUsd != null ? formatUsd(summary.costPerResultUsd) : "-"}
            subtitle="Gasto USD / resultados"
          />
          <MetricCard
            title="Ads activos"
            value={summary?.activeAdsCount ?? 0}
            subtitle="Maximo por cuenta en el rango"
          />
        </section>

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-xl font-semibold text-[#111827]">Progreso del periodo - {props.title}</h2>
            <p className="text-xs text-slate-500">
              {rangeInfo.xMode === "hour"
                ? "Eje X por hora (snapshots de 10 minutos)."
                : "Eje X por dia (snapshot diario)."}
            </p>
          </div>
          <div className="relative mt-4 h-[320px] w-full rounded-xl border border-slate-100 bg-white p-3">
            <GenericLineChart
              series={series}
              onHover={setTooltip}
              tooltip={tooltip}
              xMode={rangeInfo.xMode}
              timeZone={timezoneName}
              resultLabel={props.tooltipResultsLabel || props.resultTerm}
              currencySymbol={props.chartCurrencySymbol || "$"}
              showEndLabels={range === "today"}
            />
            {tooltip ? (
              <div
                className="pointer-events-none absolute z-20 w-max rounded-xl bg-[#0f172a] px-2 py-3 text-xs text-slate-100 shadow-xl"
                style={{ left: `${tooltip.x}px`, top: `${tooltip.y}px` }}
              >
                <p className="px-4 font-semibold text-white">{tooltip.label}</p>
                <div className="mt-1 space-y-1">
                  <p className="px-4">
                    Gasto: {formatMoneyBySymbol(tooltip.spendUsd, props.chartCurrencySymbol || "$")}
                  </p>
                  <p className="px-4">{props.tooltipResultsLabel || props.resultTerm}: {tooltip.results}</p>
                  <p className="px-4">
                    Costo:{" "}
                    {tooltip.cpr != null
                      ? formatMoneyBySymbol(tooltip.cpr, props.chartCurrencySymbol || "$")
                      : "-"}
                  </p>
                </div>
              </div>
            ) : null}
          </div>
          <div className="mt-3 flex items-center justify-center gap-6 text-xs text-slate-700">
            <LegendItem color="#7c3aed" label="Costo (costo por resultado)" />
            <LegendItem color="#1d4ed8" label="Gasto" />
            <LegendItem color="#10b981" label="Resultados" />
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-[#111827]">Ad Accounts del periodo</h2>
            <p className="text-xs text-slate-500">
              Ultima sincronizacion:{" "}
              {summary?.lastSyncedAt ? new Date(summary.lastSyncedAt).toLocaleString("es-PE") : "Aun no hay datos"}
            </p>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                  <th className="pb-3 pr-4 font-semibold">Ad Account</th>
                  <th className="pb-3 pr-4 font-semibold">Campanas activas</th>
                  <th className="pb-3 pr-4 font-semibold">Ads prendidos</th>
                  <th className="pb-3 pr-4 font-semibold">Gasto (divisa)</th>
                  <th className="pb-3 pr-4 font-semibold">Resultados</th>
                  <th className="pb-3 font-semibold">Costo por resultado (USD)</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-sm text-slate-500">
                      Cargando...
                    </td>
                  </tr>
                ) : accountRows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-sm text-slate-500">
                      Sin datos para el rango seleccionado.
                    </td>
                  </tr>
                ) : (
                  accountRows.map((row) => (
                    <tr key={row.facebook_ad_account_id} className="border-b border-slate-100 last:border-b-0">
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2">
                          <StatusDot isActive={isAccountStatusActive(row.account_status)} />
                          <p className="text-sm font-semibold text-[#111827]">{row.account_name || "Sin nombre"}</p>
                        </div>
                        <p className="text-xs text-slate-500">ID: {row.account_id || row.facebook_ad_account_id}</p>
                      </td>
                      <td className="py-3 pr-4 text-sm text-[#1D293D]">{row.active_campaigns_count}</td>
                      <td className="py-3 pr-4 text-sm text-[#1D293D]">{row.active_ads_count}</td>
                      <td className="py-3 pr-4 text-sm font-semibold text-[#1D293D]">
                        {formatLocalCurrency(row.spend_original || 0, row.currency)}
                      </td>
                      <td className="py-3 pr-4 text-sm font-semibold text-[#1D293D]">{row.result_count}</td>
                      <td className="py-3 text-sm font-semibold text-[#1D293D]">
                        {row.cost_per_result_usd != null ? formatUsd(row.cost_per_result_usd) : "-"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}

function MetricCard({ title, value, subtitle }: { title: string; value: number | string; subtitle: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <p className="mt-2 text-3xl font-bold text-[#1D293D]">{value}</p>
      <p className="mt-2 text-sm text-slate-600">{subtitle}</p>
    </div>
  );
}

function GenericLineChart({
  series,
  onHover,
  tooltip,
  xMode,
  timeZone,
  resultLabel,
  currencySymbol,
  showEndLabels,
}: {
  series: SeriesPoint[];
  onHover: (tooltip: ChartTooltip | null) => void;
  tooltip: ChartTooltip | null;
  xMode: XMode;
  timeZone: string;
  resultLabel: string;
  currencySymbol: string;
  showEndLabels: boolean;
}) {
  const width = 980;
  const height = 280;
  const padding = { top: 20, right: 64, bottom: 34, left: 64 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const leftMax = Math.max(1, ...series.flatMap((d) => [Number(d.spend_usd || 0), Number(d.result_count || 0)]));
  const rightMax = Math.max(1, ...series.map((d) => Number(d.cost_per_result_usd || 0)));
  const horizontalGridSteps = 6;

  const getHourMinuteInTimeZone = (iso: string) => {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).formatToParts(new Date(iso));
    const hour = Number(parts.find((p) => p.type === "hour")?.value || "0");
    const minute = Number(parts.find((p) => p.type === "minute")?.value || "0");
    return { hour, minute };
  };

  const points = useMemo(() => {
    const total = Math.max(series.length - 1, 1);
    const firstTime = series.length > 0 ? new Date(series[0].snapshot_time).getTime() : 0;
    const lastTime = series.length > 0 ? new Date(series[series.length - 1].snapshot_time).getTime() : 1;
    const timeRange = Math.max(lastTime - firstTime, 1);

    return series.map((d, idx) => {
      const xRatio = (() => {
        if (xMode === "day") return idx / total;
        const { hour, minute } = getHourMinuteInTimeZone(d.snapshot_time);
        return (hour * 60 + minute) / (24 * 60);
      })();
      const x = padding.left + xRatio * chartW;

      const spendY = padding.top + (1 - Number(d.spend_usd || 0) / leftMax) * chartH;
      const resultsY = padding.top + (1 - Number(d.result_count || 0) / leftMax) * chartH;
      const cprY =
        d.cost_per_result_usd == null
          ? null
          : padding.top + (1 - Number(d.cost_per_result_usd || 0) / rightMax) * chartH;

      const date = new Date(d.snapshot_time);
      const label =
        xMode === "day"
          ? date.toLocaleDateString("es-PE", { day: "2-digit", month: "2-digit" })
          : date.toLocaleTimeString("es-PE", {
              hour: "2-digit",
              minute: "2-digit",
              timeZone,
            });

      return {
        timestampMs: new Date(d.snapshot_time).getTime(),
        x,
        spendY,
        resultsY,
        cprY: cprY as number | null,
        label,
        spendUsd: Number(d.spend_usd || 0),
        results: Number(d.result_count || 0),
        cpr: d.cost_per_result_usd == null ? null : Number(d.cost_per_result_usd),
      };
    });
  }, [series, xMode, chartW, chartH, leftMax, rightMax, timeZone]);

  const spendPath = points.length ? `M ${points.map((p) => `${p.x},${p.spendY}`).join(" L ")}` : "";
  const resultsPath = points.length ? `M ${points.map((p) => `${p.x},${p.resultsY}`).join(" L ")}` : "";
  const cprPath = points.filter((p) => p.cprY != null).length
    ? `M ${points.filter((p) => p.cprY != null).map((p) => `${p.x},${p.cprY}`).join(" L ")}`
    : "";

  const endLabels = useMemo(() => {
    if (points.length === 0) return [] as Array<{ key: string; text: string; color: string; x: number; y: number }>;
    const last = points[points.length - 1];
    const baseX = Math.min(last.x + 8, width - padding.right - 6);

    const raw: Array<{ key: string; text: string; color: string; targetY: number }> = [
      {
        key: "spend",
        text: `Gasto: ${formatMoneyBySymbol(last.spendUsd, currencySymbol)}`,
        color: "#1d4ed8",
        targetY: last.spendY - 6,
      },
      {
        key: "results",
        text: `${resultLabel}: ${last.results}`,
        color: "#10b981",
        targetY: last.resultsY - 6,
      },
    ];

    if (last.cpr != null && last.cprY != null) {
      raw.push({
        key: "cpr",
        text: `Costo: ${formatMoneyBySymbol(last.cpr, currencySymbol)}`,
        color: "#7c3aed",
        targetY: last.cprY - 6,
      });
    }

    const minGap = 12;
    const minY = padding.top + 10;
    const maxY = height - padding.bottom - 8;
    const sorted = [...raw].sort((a, b) => a.targetY - b.targetY);

    let prevY = -Infinity;
    const placed = sorted.map((item) => {
      const y = Math.max(item.targetY, prevY + minGap, minY);
      prevY = y;
      return { ...item, y };
    });

    const overflow = placed.length > 0 ? placed[placed.length - 1].y - maxY : 0;
    const shifted =
      overflow > 0
        ? placed.map((item) => ({ ...item, y: Math.max(minY, item.y - overflow) }))
        : placed;

    return shifted.map((item) => ({
      key: item.key,
      text: item.text,
      color: item.color,
      x: baseX,
      y: item.y,
    }));
  }, [points, width, height, padding.top, padding.right, padding.bottom, currencySymbol, resultLabel]);

  const setLineTooltipFromMouse = (metric: "spend" | "results" | "cpr", event: ReactMouseEvent<SVGPathElement>) => {
    const svg = event.currentTarget.ownerSVGElement;
    if (!svg || points.length === 0) return;

    const rect = svg.getBoundingClientRect();
    const xInViewBox = ((event.clientX - rect.left) / rect.width) * width;
    const candidatePoints = metric === "cpr" ? points.filter((p) => p.cprY != null) : points;
    if (candidatePoints.length === 0) return;

    const nearest = candidatePoints.reduce((best, current) =>
      Math.abs(current.x - xInViewBox) < Math.abs(best.x - xInViewBox) ? current : best
    );

    const markerY = metric === "spend" ? nearest.spendY : metric === "results" ? nearest.resultsY : nearest.cprY!;
    const markerColor = metric === "spend" ? "#1d4ed8" : metric === "results" ? "#10b981" : "#7c3aed";

    onHover({
      ...nearest,
      x: nearest.x * 0.88,
      y: markerY * 0.88,
      markerX: nearest.x,
      markerY,
      markerColor,
      metric,
    });
  };

  const ticks = useMemo(() => {
    if (points.length === 0) return [] as Array<{ x: number; label: string }>;

    if (xMode === "day") {
      return points.map((point) => ({ x: point.x, label: point.label }));
    }

    const ticksByHour: Array<{ x: number; label: string }> = [];
    for (let h = 0; h <= 23; h += 1) {
      ticksByHour.push({
        x: padding.left + (h / 24) * chartW,
        label: `${h}h`,
      });
    }

    if (ticksByHour.length === 0) {
      return [{ x: points[0].x, label: "0h" }];
    }

    return ticksByHour;
  }, [points, xMode, padding.left, chartW]);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-full w-full">
      {Array.from({ length: horizontalGridSteps + 1 }).map((_, i) => {
        const y = padding.top + (i / horizontalGridSteps) * chartH;
        const leftValue = ((1 - i / horizontalGridSteps) * leftMax).toFixed(0);
        const rightValue = ((1 - i / horizontalGridSteps) * rightMax).toFixed(2);
        return (
          <g key={`grid-${i}`}>
            <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="#e2e8f0" strokeWidth="1" />
            <text x={padding.left - 8} y={y + 3} textAnchor="end" fontSize="10" fill="#64748b">
              {leftValue}
            </text>
            <text x={width - padding.right + 8} y={y + 3} textAnchor="start" fontSize="10" fill="#64748b">
              {rightValue}
            </text>
          </g>
        );
      })}

      <line x1={padding.left} y1={padding.top} x2={padding.left} y2={height - padding.bottom} stroke="#cbd5e1" />
      <line
        x1={padding.left}
        y1={height - padding.bottom}
        x2={width - padding.right}
        y2={height - padding.bottom}
        stroke="#cbd5e1"
      />
      <line
        x1={width - padding.right}
        y1={padding.top}
        x2={width - padding.right}
        y2={height - padding.bottom}
        stroke="#cbd5e1"
      />

      <text
        x={16}
        y={padding.top + chartH / 2}
        textAnchor="middle"
        fontSize="11"
        fill="#64748b"
        transform={`rotate(-90 16 ${padding.top + chartH / 2})`}
      >
        Gasto / Resultados
      </text>
      <text
        x={width - 12}
        y={padding.top + chartH / 2}
        textAnchor="middle"
        fontSize="11"
        fill="#64748b"
        transform={`rotate(90 ${width - 12} ${padding.top + chartH / 2})`}
      >
        Costo por resultado
      </text>

      {spendPath ? <path d={spendPath} fill="none" stroke="#1d4ed8" strokeWidth="2.8" strokeLinecap="round" /> : null}
      {resultsPath ? <path d={resultsPath} fill="none" stroke="#10b981" strokeWidth="2.8" strokeLinecap="round" /> : null}
      {cprPath ? <path d={cprPath} fill="none" stroke="#7c3aed" strokeWidth="2.8" strokeLinecap="round" /> : null}

      {showEndLabels
        ? endLabels.map((label) => (
            <text key={label.key} x={label.x} y={label.y} fontSize="10" fill={label.color}>
              {label.text}
            </text>
          ))
        : null}

      {spendPath ? (
        <path
          d={spendPath}
          fill="none"
          stroke="transparent"
          strokeWidth="42"
          style={{ pointerEvents: "stroke" }}
          onMouseMove={(e) => setLineTooltipFromMouse("spend", e)}
          onMouseLeave={() => onHover(null)}
        />
      ) : null}
      {resultsPath ? (
        <path
          d={resultsPath}
          fill="none"
          stroke="transparent"
          strokeWidth="42"
          style={{ pointerEvents: "stroke" }}
          onMouseMove={(e) => setLineTooltipFromMouse("results", e)}
          onMouseLeave={() => onHover(null)}
        />
      ) : null}
      {cprPath ? (
        <path
          d={cprPath}
          fill="none"
          stroke="transparent"
          strokeWidth="42"
          style={{ pointerEvents: "stroke" }}
          onMouseMove={(e) => setLineTooltipFromMouse("cpr", e)}
          onMouseLeave={() => onHover(null)}
        />
      ) : null}

      {tooltip ? (
        <circle cx={tooltip.markerX} cy={tooltip.markerY} r="4" fill={tooltip.markerColor} stroke="#fff" strokeWidth="1.5" />
      ) : null}

      {ticks.map((tick, idx) => (
        <g key={`xtick-${idx}-${tick.label}`}>
          <line
            x1={tick.x}
            y1={height - padding.bottom}
            x2={tick.x}
            y2={height - padding.bottom + 4}
            stroke="#94a3b8"
            strokeWidth="1"
          />
          <text x={tick.x} y={height - 8} textAnchor="middle" fontSize="10" fill="#64748b">
            {tick.label}
          </text>
        </g>
      ))}
    </svg>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <svg viewBox="0 0 14 8" className="h-2.5 w-4">
        <rect x="0" y="0" width="14" height="8" rx="1" fill={color} />
      </svg>
      {label}
    </span>
  );
}

function formatLocalCurrency(amount: number, currency: string | null) {
  const code = (currency || "USD").toUpperCase();
  try {
    return new Intl.NumberFormat("es-PE", {
      style: "currency",
      currency: code,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${code} ${amount.toFixed(2)}`;
  }
}

function formatUsd(amount: number) {
  return `$${Number(amount || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatMoneyBySymbol(amount: number, symbol: string) {
  const value = Number(amount || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return symbol.trim() === "S/" ? `S/ ${value}` : `${symbol}${value}`;
}

function isAccountStatusActive(status: number | null) {
  return status === 1;
}

function StatusDot({ isActive }: { isActive: boolean }) {
  return (
    <svg viewBox="0 0 16 16" className={`h-3.5 w-3.5 ${isActive ? "text-emerald-500" : "text-red-500"}`}>
      <circle cx="8" cy="8" r="6" fill="currentColor" />
    </svg>
  );
}
