"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";

type PerfStateRow = {
  entity_type: "campaign" | "adset" | "ad";
  entity_id: string;
  entity_name: string | null;
  account_name: string | null;
  spend_usd: number;
  results_count: number;
  cost_per_result_usd: number | null;
  trend: "improving" | "stable" | "worsening";
  health: "good" | "watch" | "bad";
  effective_status: string | null;
  last_synced_at: string;
};

type PerfSnapshotRow = {
  snapshot_time: string;
  spend_usd: number;
  results_count: number;
  cost_per_result_usd: number | null;
};

const LEVELS: Array<{ key: "campaign" | "adset" | "ad"; label: string }> = [
  { key: "campaign", label: "Campañas" },
  { key: "adset", label: "Adsets" },
  { key: "ad", label: "Ads" },
];

export default function RendimientoPage() {
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<"campaign" | "adset" | "ad">("campaign");
  const [stateRows, setStateRows] = useState<PerfStateRow[]>([]);
  const [series, setSeries] = useState<PerfSnapshotRow[]>([]);

  const loadData = async () => {
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
    const localDayStart = new Date(today);
    localDayStart.setHours(0, 0, 0, 0);
    const localDayStartIso = localDayStart.toISOString();

    const [stateRes, seriesRes] = await Promise.all([
      supabase
        .from("facebook_performance_state")
        .select(
          "entity_type,entity_id,entity_name,account_name,spend_usd,results_count,cost_per_result_usd,trend,health,effective_status,last_synced_at"
        )
        .eq("user_id", user.id)
        .eq("entity_type", selectedLevel)
        .order("spend_usd", { ascending: false }),
      supabase
        .from("facebook_performance_snapshots")
        .select("snapshot_time,spend_usd,results_count,cost_per_result_usd")
        .eq("user_id", user.id)
        .eq("entity_type", selectedLevel)
        .gte("snapshot_time", localDayStartIso)
        .order("snapshot_time", { ascending: true }),
    ]);

    if (stateRes.error) {
      setError(stateRes.error.message);
      setLoading(false);
      return;
    }
    if (seriesRes.error) {
      setError(seriesRes.error.message);
      setLoading(false);
      return;
    }

    setStateRows((stateRes.data as PerfStateRow[]) || []);
    setSeries((seriesRes.data as PerfSnapshotRow[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    void loadData();
  }, [selectedLevel]);

  const handleSyncNow = async () => {
    setSyncing(true);
    setError(null);
    setNotice(null);

    try {
      const response = await fetch("/api/facebook/metrics/sync", { method: "POST" });
      const payload = (await response.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!response.ok || !payload.ok) {
        throw new Error(payload.error || "No se pudo sincronizar.");
      }
      setNotice("Monitoreo actualizado correctamente.");
      await loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "No se pudo sincronizar.");
    } finally {
      setSyncing(false);
    }
  };

  const stats = useMemo(() => {
    const good = stateRows.filter((r) => r.health === "good").length;
    const watch = stateRows.filter((r) => r.health === "watch").length;
    const bad = stateRows.filter((r) => r.health === "bad").length;
    return { good, watch, bad };
  }, [stateRows]);

  return (
    <main className="px-4 py-8 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#111827] sm:text-4xl">Rendimiento</h1>
            <p className="mt-2 text-base text-slate-600">
              Monitoreo en 3 niveles: campañas, adsets y ads. Sin ejecución de reglas automática por ahora.
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

        {error ? (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        ) : null}
        {notice ? (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{notice}</div>
        ) : null}

        <section className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard title="Bueno" value={stats.good} color="text-emerald-600" />
          <StatCard title="Observación" value={stats.watch} color="text-amber-600" />
          <StatCard title="Crítico" value={stats.bad} color="text-red-600" />
        </section>

        <section className="mt-6 flex flex-wrap gap-2">
          {LEVELS.map((level) => (
            <button
              key={level.key}
              type="button"
              onClick={() => setSelectedLevel(level.key)}
              className={`rounded-lg px-4 py-2 text-sm font-semibold ${
                selectedLevel === level.key
                  ? "bg-[#1D293D] text-white"
                  : "bg-white text-slate-700 border border-slate-200"
              }`}
            >
              {level.label}
            </button>
          ))}
        </section>

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-semibold text-[#111827]">Progreso del día ({selectedLevel})</h2>
          <p className="mt-1 text-xs text-slate-500">Serie agregada por snapshots de 10 minutos.</p>
          <div className="mt-4 h-[260px] w-full rounded-xl border border-slate-100 bg-white p-3">
            <SimpleLineChart series={series} />
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-semibold text-[#111827]">Entidades monitoreadas ({selectedLevel})</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                  <th className="pb-3 pr-4 font-semibold">Entidad</th>
                  <th className="pb-3 pr-4 font-semibold">Salud</th>
                  <th className="pb-3 pr-4 font-semibold">Tendencia</th>
                  <th className="pb-3 pr-4 font-semibold">Gasto (USD)</th>
                  <th className="pb-3 pr-4 font-semibold">Resultados</th>
                  <th className="pb-3 pr-4 font-semibold">Costo/resultado</th>
                  <th className="pb-3 font-semibold">Estado</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-5 text-sm text-slate-500">Cargando...</td>
                  </tr>
                ) : stateRows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-5 text-sm text-slate-500">Sin datos todavía. Ejecuta sincronización.</td>
                  </tr>
                ) : (
                  stateRows.map((row) => (
                    <tr key={`${row.entity_type}-${row.entity_id}`} className="border-b border-slate-100 last:border-b-0">
                      <td className="py-3 pr-4">
                        <p className="text-sm font-semibold text-[#111827]">{row.entity_name || "Sin nombre"}</p>
                        <p className="text-xs text-slate-500">{row.account_name || "Sin cuenta"} - {row.entity_id}</p>
                      </td>
                      <td className="py-3 pr-4"><Badge value={row.health} /></td>
                      <td className="py-3 pr-4"><Trend value={row.trend} /></td>
                      <td className="py-3 pr-4 text-sm font-semibold text-[#1D293D]">{formatUsd(row.spend_usd)}</td>
                      <td className="py-3 pr-4 text-sm text-[#1D293D]">{row.results_count}</td>
                      <td className="py-3 pr-4 text-sm text-[#1D293D]">
                        {row.cost_per_result_usd != null ? formatUsd(row.cost_per_result_usd) : "-"}
                      </td>
                      <td className="py-3 text-sm text-[#1D293D]">{row.effective_status || "-"}</td>
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

function StatCard({ title, value, color }: { title: string; value: number; color: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <p className={`mt-2 text-3xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

function Badge({ value }: { value: "good" | "watch" | "bad" }) {
  const style =
    value === "good"
      ? "bg-emerald-100 text-emerald-700"
      : value === "watch"
        ? "bg-amber-100 text-amber-700"
        : "bg-red-100 text-red-700";
  const label = value === "good" ? "Bueno" : value === "watch" ? "Observación" : "Crítico";
  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${style}`}>{label}</span>;
}

function Trend({ value }: { value: "improving" | "stable" | "worsening" }) {
  const style =
    value === "improving"
      ? "text-emerald-600"
      : value === "worsening"
        ? "text-red-600"
        : "text-slate-600";
  const label = value === "improving" ? "Mejorando" : value === "worsening" ? "Empeorando" : "Estable";
  return <span className={`text-xs font-semibold ${style}`}>{label}</span>;
}

function SimpleLineChart({ series }: { series: PerfSnapshotRow[] }) {
  if (series.length === 0) {
    return <div className="flex h-full items-center justify-center text-sm text-slate-400">Sin datos del día</div>;
  }

  const width = 980;
  const height = 240;
  const padding = { top: 16, right: 20, bottom: 24, left: 40 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;
  const maxSpend = Math.max(1, ...series.map((s) => Number(s.spend_usd || 0)));
  const maxResults = Math.max(1, ...series.map((s) => Number(s.results_count || 0)));

  const start = new Date(series[0].snapshot_time).getTime();
  const end = new Date(series[series.length - 1].snapshot_time).getTime();
  const range = Math.max(1, end - start);

  const points = series.map((s) => {
    const t = new Date(s.snapshot_time).getTime();
    const x = padding.left + ((t - start) / range) * chartW;
    const spendY = padding.top + (1 - Number(s.spend_usd || 0) / maxSpend) * chartH;
    const resultY = padding.top + (1 - Number(s.results_count || 0) / maxResults) * chartH;
    return { x, spendY, resultY };
  });

  const spendPath = `M ${points.map((p) => `${p.x},${p.spendY}`).join(" L ")}`;
  const resultPath = `M ${points.map((p) => `${p.x},${p.resultY}`).join(" L ")}`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-full w-full">
      <line x1={padding.left} y1={height - padding.bottom} x2={width - padding.right} y2={height - padding.bottom} stroke="#cbd5e1" />
      <line x1={padding.left} y1={padding.top} x2={padding.left} y2={height - padding.bottom} stroke="#cbd5e1" />
      <path d={spendPath} fill="none" stroke="#1d4ed8" strokeWidth="2.5" />
      <path d={resultPath} fill="none" stroke="#10b981" strokeWidth="2.5" />
    </svg>
  );
}

function formatUsd(amount: number) {
  return `$${Number(amount || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

