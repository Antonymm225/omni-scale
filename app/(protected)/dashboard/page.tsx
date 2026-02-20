"use client";

import { useEffect, useMemo, useState, type MouseEvent as ReactMouseEvent } from "react";
import { supabase } from "../../lib/supabaseClient";

type DashboardMetrics = {
  active_accounts_count: number;
  active_ads_count: number;
  total_spend_usd: number;
  total_leads: number;
  cost_per_result_usd: number | null;
  source_date: string;
  last_synced_at: string;
};

type AdAccountMetric = {
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
};

type TimeseriesPoint = {
  snapshot_time: string;
  spend_usd: number;
  leads_count: number;
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
  leads: number;
  cpr: number | null;
};

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [accountRows, setAccountRows] = useState<AdAccountMetric[]>([]);
  const [series, setSeries] = useState<TimeseriesPoint[]>([]);
  const [tooltip, setTooltip] = useState<ChartTooltip | null>(null);

  const loadMetrics = async () => {
    setLoading(true);
    setError(null);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setError("No se pudo validar la sesión.");
      setLoading(false);
      return;
    }

    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, "0");
    const d = String(today.getDate()).padStart(2, "0");
    const todayDate = `${y}-${m}-${d}`;

    const [metricsRes, accountsRes, seriesRes] = await Promise.all([
      supabase
        .from("facebook_dashboard_metrics")
        .select(
          "active_accounts_count,active_ads_count,total_spend_usd,total_leads,cost_per_result_usd,source_date,last_synced_at"
        )
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase
        .from("facebook_dashboard_ad_account_metrics")
        .select(
          "facebook_ad_account_id,account_id,account_name,active_ads_count,is_active_account,account_status,spend_original,currency,spend_usd,leads_count,cost_per_result_usd"
        )
        .eq("user_id", user.id)
        .eq("is_active_account", true)
        .order("spend_usd", { ascending: false }),
      supabase
        .from("facebook_dashboard_timeseries")
        .select("snapshot_time,spend_usd,leads_count,cost_per_result_usd")
        .eq("user_id", user.id)
        .eq("source_date", todayDate)
        .order("snapshot_time", { ascending: true }),
    ]);

    if (metricsRes.error) {
      setError(metricsRes.error.message);
      setLoading(false);
      return;
    }

    if (accountsRes.error) {
      setError(accountsRes.error.message);
      setLoading(false);
      return;
    }

    if (seriesRes.error) {
      setError(seriesRes.error.message);
      setLoading(false);
      return;
    }

    setMetrics((metricsRes.data as DashboardMetrics | null) || null);
    setAccountRows((accountsRes.data as AdAccountMetric[]) || []);
    setSeries((seriesRes.data as TimeseriesPoint[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    void loadMetrics();
  }, []);

  const handleSyncNow = async () => {
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

      setNotice("Sincronización ejecutada correctamente.");
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
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#111827] sm:text-4xl">Dashboard</h1>
            <p className="mt-2 text-base text-slate-600">
              Métricas sincronizadas con Meta, actualizadas automáticamente cada 10 minutos.
            </p>
          </div>
          <button
            type="button"
            onClick={handleSyncNow}
            disabled={syncing}
            className="inline-flex items-center justify-center rounded-lg bg-[#1D293D] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {syncing ? "Sincronizando..." : "Sincronizar ahora"}
          </button>
        </header>

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

        {loading ? (
          <>
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
            <div className="mt-6 animate-pulse rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="h-5 w-52 rounded bg-slate-200" />
              <div className="mt-4 h-64 w-full rounded bg-slate-100" />
            </div>
            <div className="mt-6 animate-pulse rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="h-5 w-52 rounded bg-slate-200" />
              <div className="mt-4 h-10 w-full rounded bg-slate-100" />
              <div className="mt-2 h-10 w-full rounded bg-slate-100" />
              <div className="mt-2 h-10 w-full rounded bg-slate-100" />
            </div>
          </>
        ) : (
          <>
            <section className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <MetricCard
                title="Cuentas activas"
                value={metrics?.active_accounts_count ?? 0}
                subtitle="Con campaña activa y ads activos"
              />
              <MetricCard
                title="Gasto total hoy (USD)"
                value={formatUsd(metrics?.total_spend_usd ?? 0)}
                subtitle="Suma de gasto diario por ad account"
              />
              <MetricCard
                title="Costo por resultado"
                value={metrics?.cost_per_result_usd != null ? formatUsd(metrics.cost_per_result_usd) : "-"}
                subtitle="Gasto total USD / leads totales"
              />
              <MetricCard
                title="Ads activos"
                value={metrics?.active_ads_count ?? 0}
                subtitle="Total de anuncios en ejecución"
              />
            </section>

            <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-xl font-semibold text-[#111827]">Progreso del día</h2>
                <p className="text-xs text-slate-500">
                  Eje izquierdo: gasto (USD) y resultados. Eje derecho: costo por resultado (USD).
                </p>
              </div>

              <div className="relative mt-4 h-[320px] w-full rounded-xl border border-slate-100 bg-white p-3">
                <DashboardLineChart series={series} onHover={setTooltip} tooltip={tooltip} />

                {tooltip ? (
                  <div
                    className="pointer-events-none absolute z-20 rounded-lg bg-[#0f172a] px-3 py-2 text-xs text-slate-100 shadow-xl"
                    style={{ left: `${tooltip.x}px`, top: `${tooltip.y}px` }}
                  >
                    <p className="font-semibold text-white">{tooltip.label}</p>
                    {tooltip.metric === "spend" ? <p>Gasto: {formatUsd(tooltip.spendUsd)}</p> : null}
                    {tooltip.metric === "results" ? <p>Resultados: {tooltip.leads}</p> : null}
                    {tooltip.metric === "cpr" ? (
                      <p>Costo/resultado: {tooltip.cpr != null ? formatUsd(tooltip.cpr) : "-"}</p>
                    ) : null}
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
                <h2 className="text-xl font-semibold text-[#111827]">Ad Accounts del día</h2>
                <p className="text-xs text-slate-500">
                  Última sincronización: {metrics?.last_synced_at
                    ? new Date(metrics.last_synced_at).toLocaleString("es-PE")
                    : "Aún no hay datos"}
                </p>
              </div>

              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                      <th className="pb-3 pr-4 font-semibold">Ad Account</th>
                      <th className="pb-3 pr-4 font-semibold">Ads prendidos</th>
                      <th className="pb-3 pr-4 font-semibold">Gasto día (divisa)</th>
                      <th className="pb-3 font-semibold">Costo por resultado (USD)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {accountRows.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-6 text-sm text-slate-500">
                          Aún no hay ad accounts sincronizadas para hoy.
                        </td>
                      </tr>
                    ) : (
                      accountRows.map((row) => (
                        <tr key={row.facebook_ad_account_id} className="border-b border-slate-100 last:border-b-0">
                          <td className="py-3 pr-4">
                            <div className="flex items-center gap-2">
                              <StatusDot isActive={isAccountStatusActive(row.account_status)} />
                              <p className="text-sm font-semibold text-[#111827]">
                                {row.account_name || "Sin nombre"}
                              </p>
                            </div>
                            <p className="text-xs text-slate-500">
                              ID: {row.account_id || row.facebook_ad_account_id}
                            </p>
                          </td>
                          <td className="py-3 pr-4 text-sm text-[#1D293D]">{row.active_ads_count}</td>
                          <td className="py-3 pr-4 text-sm font-semibold text-[#1D293D]">
                            {formatLocalCurrency(row.spend_original || 0, row.currency)}
                          </td>
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
          </>
        )}
      </div>
    </main>
  );
}

function MetricCard({
  title,
  value,
  subtitle,
}: {
  title: string;
  value: number | string;
  subtitle: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <p className="mt-2 text-3xl font-bold text-[#1D293D]">{value}</p>
      <p className="mt-2 text-sm text-slate-600">{subtitle}</p>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="h-4 w-40 rounded bg-slate-200" />
      <div className="mt-3 h-9 w-24 rounded bg-slate-200" />
      <div className="mt-3 h-4 w-48 rounded bg-slate-200" />
    </div>
  );
}

function DashboardLineChart({
  series,
  onHover,
  tooltip,
}: {
  series: TimeseriesPoint[];
  onHover: (tooltip: ChartTooltip | null) => void;
  tooltip: ChartTooltip | null;
}) {
  const width = 980;
  const height = 280;
  const padding = { top: 20, right: 64, bottom: 34, left: 64 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const now = new Date();
  const dayStart = new Date(now);
  dayStart.setHours(0, 0, 0, 0);
  const totalRangeMs = Math.max(now.getTime() - dayStart.getTime(), 1);

  const leftMax = Math.max(
    1,
    ...series.flatMap((d) => [Number(d.spend_usd || 0), Number(d.leads_count || 0)])
  );
  const rightMax = Math.max(1, ...series.map((d) => Number(d.cost_per_result_usd || 0)));
  const horizontalGridSteps = 6;
  const currentHour = now.getHours();
  const lastSnapshotMs = series.length
    ? new Date(series[series.length - 1].snapshot_time).getTime()
    : now.getTime();

  const points = useMemo(() => {
    return series.map((d) => {
      const t = new Date(d.snapshot_time).getTime();
      const xRatio = Math.min(Math.max((t - dayStart.getTime()) / totalRangeMs, 0), 1);
      const x = padding.left + xRatio * chartW;

      const rawSpendY = padding.top + (1 - Number(d.spend_usd || 0) / leftMax) * chartH;
      const spendY =
        Number(d.spend_usd || 0) > 0
          ? Math.min(rawSpendY, height - padding.bottom - 2)
          : rawSpendY;
      const leadsY = padding.top + (1 - Number(d.leads_count || 0) / leftMax) * chartH;
      const cprY =
        d.cost_per_result_usd == null
          ? null
          : padding.top + (1 - Number(d.cost_per_result_usd || 0) / rightMax) * chartH;

      return {
        x,
        spendY,
        leadsY,
        cprY,
        label: new Date(d.snapshot_time).toLocaleTimeString("es-PE", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        spendUsd: Number(d.spend_usd || 0),
        leads: Number(d.leads_count || 0),
        cpr: d.cost_per_result_usd == null ? null : Number(d.cost_per_result_usd),
      };
    });
  }, [series, totalRangeMs, dayStart, chartW, chartH, leftMax, rightMax]);

  const spendPath = points.length
    ? `M ${points.map((p) => `${p.x},${p.spendY}`).join(" L ")}`
    : "";
  const leadsPath = points.length
    ? `M ${points.map((p) => `${p.x},${p.leadsY}`).join(" L ")}`
    : "";
  const cprPath = points.filter((p) => p.cprY != null).length
    ? `M ${points
        .filter((p) => p.cprY != null)
        .map((p) => `${p.x},${p.cprY}`)
        .join(" L ")}`
    : "";

  const setLineTooltipFromMouse = (
    metric: "spend" | "results" | "cpr",
    event: ReactMouseEvent<SVGPathElement>
  ) => {
    const svg = event.currentTarget.ownerSVGElement;
    if (!svg || points.length === 0) return;

    const rect = svg.getBoundingClientRect();
    const xInViewBox = ((event.clientX - rect.left) / rect.width) * width;

    const candidatePoints =
      metric === "cpr" ? points.filter((p) => p.cprY != null) : points;
    if (candidatePoints.length === 0) return;

    const nearest = candidatePoints.reduce((best, current) =>
      Math.abs(current.x - xInViewBox) < Math.abs(best.x - xInViewBox) ? current : best
    );

    const markerY =
      metric === "spend" ? nearest.spendY : metric === "results" ? nearest.leadsY : nearest.cprY!;
    const markerColor = metric === "spend" ? "#1d4ed8" : metric === "results" ? "#10b981" : "#7c3aed";

    onHover({
      ...nearest,
      x: nearest.x * 0.9,
      y: markerY * 0.9,
      markerX: nearest.x,
      markerY,
      markerColor,
      metric,
    });
  };

  const hourTicks = Array.from({ length: currentHour + 1 }).map((_, hour) => {
    const t = new Date(dayStart);
    t.setHours(hour, 0, 0, 0);
    const xRatio = Math.min(Math.max((t.getTime() - dayStart.getTime()) / totalRangeMs, 0), 1);
    return {
      x: padding.left + xRatio * chartW,
      label: `${String(hour).padStart(2, "0")}h`,
    };
  });

  const lastTickRatio = Math.min(Math.max((lastSnapshotMs - dayStart.getTime()) / totalRangeMs, 0), 1);
  const lastSnapshotDate = new Date(lastSnapshotMs);
  const lastTick = {
    x: padding.left + lastTickRatio * chartW,
    label: lastSnapshotDate.toLocaleTimeString("es-PE", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }),
  };
  const lastHourLabel = `${String(lastSnapshotDate.getHours()).padStart(2, "0")}h`;
  const hideRoundedHourTick = lastSnapshotDate.getMinutes() < 30;
  const renderedHourTicks = hourTicks.filter(
    (tick) => !(hideRoundedHourTick && tick.label === lastHourLabel && lastTick.label !== lastHourLabel)
  );
  const shouldRenderLastTick = lastTick.label !== lastHourLabel;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-full w-full">
      {Array.from({ length: horizontalGridSteps + 1 }).map((_, i) => {
        const y = padding.top + (i / horizontalGridSteps) * chartH;
        return (
          <line
            key={`grid-${i}`}
            x1={padding.left}
            y1={y}
            x2={width - padding.right}
            y2={y}
            stroke="#e2e8f0"
            strokeWidth="1"
          />
        );
      })}

      <line x1={padding.left} y1={padding.top} x2={padding.left} y2={height - padding.bottom} stroke="#cbd5e1" />
      <line x1={padding.left} y1={height - padding.bottom} x2={width - padding.right} y2={height - padding.bottom} stroke="#cbd5e1" />
      <line x1={width - padding.right} y1={padding.top} x2={width - padding.right} y2={height - padding.bottom} stroke="#cbd5e1" />

      <text
        x={44}
        y={padding.top + chartH / 2}
        transform={`rotate(-90 44 ${padding.top + chartH / 2})`}
        textAnchor="middle"
        fontSize="11"
        fill="#475569"
      >
        Gasto / Resultados
      </text>
      <text
        x={width - padding.right + 20}
        y={padding.top + chartH / 2}
        transform={`rotate(90 ${width - padding.right + 20} ${padding.top + chartH / 2})`}
        textAnchor="middle"
        fontSize="11"
        fill="#475569"
      >
        Costo por resultado (USD)
      </text>

      <text x={padding.left - 8} y={padding.top + 4} textAnchor="end" fontSize="10" fill="#64748b">
        {leftMax.toFixed(0)}
      </text>
      <text x={padding.left - 8} y={height - padding.bottom + 4} textAnchor="end" fontSize="10" fill="#64748b">
        0
      </text>
      <text x={width - padding.right + 8} y={padding.top + 4} fontSize="10" fill="#64748b">
        {rightMax.toFixed(0)}
      </text>
      <text x={width - padding.right + 8} y={height - padding.bottom + 4} fontSize="10" fill="#64748b">
        0
      </text>

      {spendPath ? (
        <>
          <path d={spendPath} fill="none" stroke="#ffffff" strokeWidth="6" strokeLinecap="round" />
          <path d={spendPath} fill="none" stroke="#1d4ed8" strokeWidth="3.2" strokeLinecap="round" />
        </>
      ) : null}
      {leadsPath ? (
        <path d={leadsPath} fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" />
      ) : null}
      {cprPath ? <path d={cprPath} fill="none" stroke="#7c3aed" strokeWidth="2" /> : null}

      {spendPath ? (
        <path
          d={spendPath}
          fill="none"
          stroke="transparent"
          strokeWidth="28"
          style={{ pointerEvents: "stroke" }}
          onMouseMove={(event) => setLineTooltipFromMouse("spend", event)}
          onMouseLeave={() => onHover(null)}
        />
      ) : null}
      {leadsPath ? (
        <path
          d={leadsPath}
          fill="none"
          stroke="transparent"
          strokeWidth="28"
          style={{ pointerEvents: "stroke" }}
          onMouseMove={(event) => setLineTooltipFromMouse("results", event)}
          onMouseLeave={() => onHover(null)}
        />
      ) : null}
      {cprPath ? (
        <path
          d={cprPath}
          fill="none"
          stroke="transparent"
          strokeWidth="28"
          style={{ pointerEvents: "stroke" }}
          onMouseMove={(event) => setLineTooltipFromMouse("cpr", event)}
          onMouseLeave={() => onHover(null)}
        />
      ) : null}

      {points.map((p, idx) => (
        <g key={`pt-${idx}`}>
          <circle
            cx={p.x}
            cy={p.spendY}
            r="16"
            fill="transparent"
                onMouseEnter={() =>
                  onHover({
                    ...p,
                    x: p.x * 0.9,
                    y: p.spendY * 0.9,
                    markerX: p.x,
                    markerY: p.spendY,
                    markerColor: "#1d4ed8",
                    metric: "spend",
                  })
                }
            onMouseLeave={() => onHover(null)}
          />
          <circle
            cx={p.x}
            cy={p.leadsY}
            r="16"
            fill="transparent"
                onMouseEnter={() =>
                  onHover({
                    ...p,
                    x: p.x * 0.9,
                    y: p.leadsY * 0.9,
                    markerX: p.x,
                    markerY: p.leadsY,
                    markerColor: "#10b981",
                    metric: "results",
                  })
                }
            onMouseLeave={() => onHover(null)}
          />
          {p.cprY != null ? (
            <circle
              cx={p.x}
              cy={p.cprY}
              r="16"
              fill="transparent"
                onMouseEnter={() =>
                  onHover({
                    ...p,
                    x: p.x * 0.9,
                    y: p.cprY! * 0.9,
                    markerX: p.x,
                    markerY: p.cprY!,
                    markerColor: "#7c3aed",
                    metric: "cpr",
                  })
                }
              onMouseLeave={() => onHover(null)}
            />
          ) : null}
        </g>
      ))}

      {tooltip ? (
        <circle cx={tooltip.markerX} cy={tooltip.markerY} r="4" fill={tooltip.markerColor} stroke="#ffffff" strokeWidth="1.5" />
      ) : null}

      {renderedHourTicks.map((tick) => (
        <g key={`xtick-${tick.label}`}>
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

      {shouldRenderLastTick ? (
        <g>
          <line
            x1={lastTick.x}
            y1={height - padding.bottom}
            x2={lastTick.x}
            y2={height - padding.bottom + 4}
            stroke="#94a3b8"
            strokeWidth="1"
          />
          <text x={lastTick.x} y={height - 8} textAnchor="middle" fontSize="10" fill="#64748b">
            {lastTick.label}
          </text>
        </g>
      ) : null}
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
  return `$${Number(amount || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
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
