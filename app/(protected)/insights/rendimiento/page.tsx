"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";

type PerfEntityType = "account" | "campaign" | "adset" | "ad";
type Trend = "improving" | "stable" | "worsening";
type Health = "good" | "watch" | "bad";
type AiRecommendation = "improving" | "stable" | "scale" | "worsening" | null;

type PerfStateRow = {
  entity_type: PerfEntityType;
  entity_id: string;
  entity_name: string | null;
  facebook_ad_account_id: string;
  account_name: string | null;
  campaign_id: string | null;
  campaign_name: string | null;
  adset_id: string | null;
  adset_name: string | null;
  ad_id: string | null;
  ad_name: string | null;
  spend_usd: number;
  results_count: number;
  cost_per_result_usd: number | null;
  cpm: number | null;
  ctr: number | null;
  cpc_usd: number | null;
  trend: Trend;
  health: Health;
  ai_recommendation: AiRecommendation;
  ai_reason_short: string | null;
  ai_confidence_score: number | null;
  ai_model: string | null;
  effective_status: string | null;
  last_synced_at: string;
};

type AiRunRow = {
  last_ai_run_at?: string | null;
  last_status?: string | null;
  last_error?: string | null;
  last_openai_entities?: number | null;
  last_total_entities?: number | null;
  last_model?: string | null;
};

export default function RendimientoPage() {
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [rows, setRows] = useState<PerfStateRow[]>([]);
  const [aiRun, setAiRun] = useState<AiRunRow | null>(null);

  const [viewLevel, setViewLevel] = useState<PerfEntityType>("account");
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [selectedCampaigns, setSelectedCampaigns] = useState<string[]>([]);
  const [selectedAdsets, setSelectedAdsets] = useState<string[]>([]);
  const [selectedAds, setSelectedAds] = useState<string[]>([]);

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

    const [stateRes, aiRunRes] = await Promise.all([
      supabase
        .from("facebook_performance_state")
        .select(
          "entity_type,entity_id,entity_name,facebook_ad_account_id,account_name,campaign_id,campaign_name,adset_id,adset_name,ad_id,ad_name,spend_usd,results_count,cost_per_result_usd,cpm,ctr,cpc_usd,trend,health,ai_recommendation,ai_reason_short,ai_confidence_score,ai_model,effective_status,last_synced_at"
        )
        .eq("user_id", user.id),
      supabase
        .from("facebook_ai_runs")
        .select("last_ai_run_at,last_status,last_error,last_openai_entities,last_total_entities,last_model")
        .eq("user_id", user.id)
        .maybeSingle(),
    ]);

    if (stateRes.error) {
      setError(stateRes.error.message);
      setLoading(false);
      return;
    }

    const stateRows = ((stateRes.data || []) as PerfStateRow[]).sort(
      (a, b) => Number(b.spend_usd || 0) - Number(a.spend_usd || 0)
    );
    setRows(stateRows);
    setAiRun((aiRunRes.data || null) as AiRunRow | null);
    setLoading(false);
  };

  useEffect(() => {
    void loadData();
  }, []);

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

  const accountRows = useMemo(
    () => rows.filter((row) => row.entity_type === "account"),
    [rows]
  );
  const campaignRows = useMemo(
    () => rows.filter((row) => row.entity_type === "campaign"),
    [rows]
  );
  const adsetRows = useMemo(
    () => rows.filter((row) => row.entity_type === "adset"),
    [rows]
  );
  const adRows = useMemo(() => rows.filter((row) => row.entity_type === "ad"), [rows]);

  const filteredCampaignRows = useMemo(() => {
    if (selectedAccounts.length === 0) return campaignRows;
    const selected = new Set(selectedAccounts);
    return campaignRows.filter((row) => selected.has(row.facebook_ad_account_id));
  }, [campaignRows, selectedAccounts]);

  const filteredAdsetRows = useMemo(() => {
    if (selectedCampaigns.length > 0) {
      const selected = new Set(selectedCampaigns);
      return adsetRows.filter((row) => row.campaign_id && selected.has(row.campaign_id));
    }
    if (selectedAccounts.length > 0) {
      const selected = new Set(selectedAccounts);
      return adsetRows.filter((row) => selected.has(row.facebook_ad_account_id));
    }
    return adsetRows;
  }, [adsetRows, selectedAccounts, selectedCampaigns]);

  const filteredAdRows = useMemo(() => {
    if (selectedAdsets.length > 0) {
      const selected = new Set(selectedAdsets);
      return adRows.filter((row) => row.adset_id && selected.has(row.adset_id));
    }
    if (selectedCampaigns.length > 0) {
      const selected = new Set(selectedCampaigns);
      return adRows.filter((row) => row.campaign_id && selected.has(row.campaign_id));
    }
    if (selectedAccounts.length > 0) {
      const selected = new Set(selectedAccounts);
      return adRows.filter((row) => selected.has(row.facebook_ad_account_id));
    }
    return adRows;
  }, [adRows, selectedAccounts, selectedCampaigns, selectedAdsets]);

  const currentRows = useMemo(() => {
    if (viewLevel === "account") return accountRows;
    if (viewLevel === "campaign") return filteredCampaignRows;
    if (viewLevel === "adset") return filteredAdsetRows;
    return filteredAdRows;
  }, [viewLevel, accountRows, filteredCampaignRows, filteredAdsetRows, filteredAdRows]);

  const stats = useMemo(() => {
    const good = currentRows.filter((r) => r.health === "good").length;
    const watch = currentRows.filter((r) => r.health === "watch").length;
    const bad = currentRows.filter((r) => r.health === "bad").length;
    return { good, watch, bad };
  }, [currentRows]);

  const aiCoverage = useMemo(() => {
    const openAiRows = rows.filter((row) => row.ai_model && row.ai_model !== "rule" && row.ai_model !== "derived")
      .length;
    const total = rows.length;
    return `${Number(aiRun?.last_openai_entities || openAiRows)}/${Number(aiRun?.last_total_entities || total)}`;
  }, [rows, aiRun]);

  const toggleSelected = (level: PerfEntityType, id: string) => {
    if (level === "account") {
      setSelectedAccounts((prev) => toggleInArray(prev, id));
      setSelectedCampaigns([]);
      setSelectedAdsets([]);
      setSelectedAds([]);
      return;
    }
    if (level === "campaign") {
      setSelectedCampaigns((prev) => toggleInArray(prev, id));
      setSelectedAdsets([]);
      setSelectedAds([]);
      return;
    }
    if (level === "adset") {
      setSelectedAdsets((prev) => toggleInArray(prev, id));
      setSelectedAds([]);
      return;
    }
    setSelectedAds((prev) => toggleInArray(prev, id));
  };

  const drillDown = (row: PerfStateRow) => {
    if (viewLevel === "account") {
      if (!selectedAccounts.includes(row.facebook_ad_account_id)) {
        setSelectedAccounts([row.facebook_ad_account_id]);
      }
      setSelectedCampaigns([]);
      setSelectedAdsets([]);
      setSelectedAds([]);
      setViewLevel("campaign");
      return;
    }
    if (viewLevel === "campaign") {
      if (row.campaign_id) {
        if (!selectedCampaigns.includes(row.campaign_id)) setSelectedCampaigns([row.campaign_id]);
        if (!selectedAccounts.includes(row.facebook_ad_account_id)) {
          setSelectedAccounts([row.facebook_ad_account_id]);
        }
      }
      setSelectedAdsets([]);
      setSelectedAds([]);
      setViewLevel("adset");
      return;
    }
    if (viewLevel === "adset") {
      if (row.adset_id) {
        if (!selectedAdsets.includes(row.adset_id)) setSelectedAdsets([row.adset_id]);
        if (row.campaign_id && !selectedCampaigns.includes(row.campaign_id)) {
          setSelectedCampaigns([row.campaign_id]);
        }
        if (!selectedAccounts.includes(row.facebook_ad_account_id)) {
          setSelectedAccounts([row.facebook_ad_account_id]);
        }
      }
      setViewLevel("ad");
    }
  };

  const goToLevel = (level: PerfEntityType) => {
    setViewLevel(level);
    if (level === "account") {
      setSelectedAccounts([]);
      setSelectedCampaigns([]);
      setSelectedAdsets([]);
      setSelectedAds([]);
    }
    if (level === "campaign") {
      setSelectedCampaigns([]);
      setSelectedAdsets([]);
      setSelectedAds([]);
    }
    if (level === "adset") {
      setSelectedAdsets([]);
      setSelectedAds([]);
    }
  };

  const currentSelectableIds = useMemo(() => {
    if (viewLevel === "account") return currentRows.map((row) => row.facebook_ad_account_id);
    if (viewLevel === "campaign")
      return currentRows.map((row) => row.campaign_id || row.entity_id);
    if (viewLevel === "adset") return currentRows.map((row) => row.adset_id || row.entity_id);
    return currentRows.map((row) => row.ad_id || row.entity_id);
  }, [currentRows, viewLevel]);

  const selectedCurrentSet = useMemo(() => {
    if (viewLevel === "account") return new Set(selectedAccounts);
    if (viewLevel === "campaign") return new Set(selectedCampaigns);
    if (viewLevel === "adset") return new Set(selectedAdsets);
    return new Set(selectedAds);
  }, [viewLevel, selectedAccounts, selectedCampaigns, selectedAdsets, selectedAds]);

  const allSelected =
    currentSelectableIds.length > 0 &&
    currentSelectableIds.every((id) => selectedCurrentSet.has(id));

  const toggleSelectAllInView = () => {
    const ids = [...new Set(currentSelectableIds)];
    const shouldSelectAll = !allSelected;
    if (viewLevel === "account") {
      setSelectedAccounts(shouldSelectAll ? ids : []);
      setSelectedCampaigns([]);
      setSelectedAdsets([]);
      setSelectedAds([]);
      return;
    }
    if (viewLevel === "campaign") {
      setSelectedCampaigns(shouldSelectAll ? ids : []);
      setSelectedAdsets([]);
      setSelectedAds([]);
      return;
    }
    if (viewLevel === "adset") {
      setSelectedAdsets(shouldSelectAll ? ids : []);
      setSelectedAds([]);
      return;
    }
    setSelectedAds(shouldSelectAll ? ids : []);
  };

  return (
    <main className="px-4 py-8 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#111827] sm:text-4xl">Rendimiento</h1>
            <p className="mt-2 text-base text-slate-600">
              Vista jerárquica: Cuentas → Campañas → Adsets → Ads.
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

        <section className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <InfoCard
            title="Estado AI"
            value={aiRun?.last_status || "idle"}
            subtitle={aiRun?.last_error ? `Motivo: ${aiRun.last_error}` : "Evaluación cada 30 minutos"}
            tone={aiRun?.last_status === "running" ? "text-amber-700" : "text-slate-700"}
          />
          <InfoCard
            title="Último análisis"
            value={aiRun?.last_ai_run_at ? new Date(aiRun.last_ai_run_at).toLocaleString("es-PE") : "-"}
            subtitle="Toma gasto, resultados, costo, cpc, ctr y cpm"
            tone="text-slate-700"
          />
          <InfoCard
            title="Cobertura OpenAI"
            value={aiCoverage}
            subtitle={`Modelo: ${aiRun?.last_model || "rule/derived"}`}
            tone="text-sky-700"
          />
        </section>

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center gap-2">
            <BreadcrumbButton label="Cuentas" active={viewLevel === "account"} onClick={() => goToLevel("account")} />
            <span className="text-slate-300">/</span>
            <BreadcrumbButton label="Campañas" active={viewLevel === "campaign"} onClick={() => goToLevel("campaign")} />
            <span className="text-slate-300">/</span>
            <BreadcrumbButton label="Adsets" active={viewLevel === "adset"} onClick={() => goToLevel("adset")} />
            <span className="text-slate-300">/</span>
            <BreadcrumbButton label="Ads" active={viewLevel === "ad"} onClick={() => goToLevel("ad")} />
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-semibold text-[#111827]">
            Entidades ({getLevelLabel(viewLevel)})
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Click en nombre para bajar de nivel. Usa checkbox para selección múltiple.
          </p>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                  <th className="pb-3 pr-4 font-semibold">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleSelectAllInView}
                      className="h-4 w-4 rounded border-slate-300 text-[#1D293D] focus:ring-[#1D293D]"
                      aria-label="Seleccionar todo"
                    />
                  </th>
                  <th className="pb-3 pr-4 font-semibold">Entidad</th>
                  <th className="pb-3 pr-4 font-semibold">Salud</th>
                  <th className="pb-3 pr-4 font-semibold">Tendencia</th>
                  <th className="pb-3 pr-4 font-semibold">Gasto (USD)</th>
                  <th className="pb-3 pr-4 font-semibold">Resultados</th>
                  <th className="pb-3 pr-4 font-semibold">Costo</th>
                  <th className="pb-3 pr-4 font-semibold">CPM</th>
                  <th className="pb-3 pr-4 font-semibold">CTR</th>
                  <th className="pb-3 pr-4 font-semibold">CPC</th>
                  <th className="pb-3 pr-4 font-semibold">AI Recommendation</th>
                  <th className="pb-3 pr-4 font-semibold">Confidence</th>
                  <th className="pb-3 font-semibold">Estado</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={13} className="py-5 text-sm text-slate-500">
                      Cargando...
                    </td>
                  </tr>
                ) : currentRows.length === 0 ? (
                  <tr>
                    <td colSpan={13} className="py-5 text-sm text-slate-500">
                      Sin datos para este filtro.
                    </td>
                  </tr>
                ) : (
                  currentRows.map((row) => {
                    const keySet = selectedCurrentSet;
                    const selectableId =
                      viewLevel === "account"
                        ? row.facebook_ad_account_id
                        : viewLevel === "campaign"
                          ? row.campaign_id || row.entity_id
                          : viewLevel === "adset"
                            ? row.adset_id || row.entity_id
                            : row.ad_id || row.entity_id;
                    const checked = keySet.has(selectableId);
                    return (
                      <tr key={`${row.entity_type}-${row.entity_id}`} className="border-b border-slate-100 last:border-b-0">
                        <td className="py-3 pr-4">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleSelected(viewLevel, selectableId)}
                            className="h-4 w-4 rounded border-slate-300 text-[#1D293D] focus:ring-[#1D293D]"
                          />
                        </td>
                        <td className="py-3 pr-4">
                          <button
                            type="button"
                            onClick={() => drillDown(row)}
                            disabled={viewLevel === "ad"}
                            className="text-left disabled:cursor-default"
                          >
                            <p className="text-sm font-semibold text-[#111827] underline decoration-transparent underline-offset-2 hover:decoration-[#1D293D] hover:text-[#1D293D]">
                              {row.entity_name || "Sin nombre"}
                            </p>
                            <p className="text-xs text-slate-500">
                              {row.account_name || "Sin cuenta"} - {row.entity_id}
                            </p>
                          </button>
                        </td>
                        <td className="py-3 pr-4"><Badge value={row.health} /></td>
                        <td className="py-3 pr-4"><TrendBadge value={row.trend} /></td>
                        <td className="py-3 pr-4 text-sm font-semibold text-[#1D293D]">{formatUsd(row.spend_usd)}</td>
                        <td className="py-3 pr-4 text-sm text-[#1D293D]">{row.results_count}</td>
                        <td className="py-3 pr-4 text-sm text-[#1D293D]">
                          {row.cost_per_result_usd != null ? formatUsd(row.cost_per_result_usd) : "-"}
                        </td>
                        <td className="py-3 pr-4 text-sm text-[#1D293D]">{row.cpm != null ? Number(row.cpm).toFixed(2) : "-"}</td>
                        <td className="py-3 pr-4 text-sm text-[#1D293D]">{row.ctr != null ? `${Number(row.ctr).toFixed(2)}%` : "-"}</td>
                        <td className="py-3 pr-4 text-sm text-[#1D293D]">{row.cpc_usd != null ? formatUsd(row.cpc_usd) : "-"}</td>
                        <td className="py-3 pr-4 text-sm text-[#1D293D]">
                          <AiRecommendationPill recommendation={row.ai_recommendation} reason={row.ai_reason_short} />
                        </td>
                        <td className="py-3 pr-4 text-sm text-[#1D293D]">{row.ai_confidence_score != null ? `${row.ai_confidence_score}%` : "-"}</td>
                        <td className="py-3 text-sm text-[#1D293D]">{row.effective_status || "-"}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}

function toggleInArray(items: string[], id: string) {
  return items.includes(id) ? items.filter((item) => item !== id) : [...items, id];
}

function StatCard({ title, value, color }: { title: string; value: number; color: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <p className={`mt-2 text-3xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

function InfoCard({
  title,
  value,
  subtitle,
  tone,
}: {
  title: string;
  value: string;
  subtitle: string;
  tone: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <p className={`mt-2 text-lg font-semibold ${tone}`}>{value}</p>
      <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
    </div>
  );
}

function BreadcrumbButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold ${
        active ? "bg-[#1D293D] text-white" : "text-slate-600 hover:bg-slate-100"
      }`}
    >
      {label}
    </button>
  );
}

function Badge({ value }: { value: Health }) {
  const style =
    value === "good"
      ? "bg-emerald-100 text-emerald-700"
      : value === "watch"
        ? "bg-amber-100 text-amber-700"
        : "bg-red-100 text-red-700";
  const label = value === "good" ? "Bueno" : value === "watch" ? "Observación" : "Crítico";
  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${style}`}>{label}</span>;
}

function TrendBadge({ value }: { value: Trend }) {
  const style =
    value === "improving" ? "text-emerald-600" : value === "worsening" ? "text-red-600" : "text-slate-600";
  const label = value === "improving" ? "Mejorando" : value === "worsening" ? "Empeorando" : "Estable";
  return <span className={`text-xs font-semibold ${style}`}>{label}</span>;
}

function AiRecommendationPill({ recommendation, reason }: { recommendation: AiRecommendation; reason: string | null }) {
  const rec = recommendation || "stable";
  const label =
    rec === "improving" ? "Mejorando" : rec === "scale" ? "Escalar" : rec === "worsening" ? "Empeorando" : "Estable";
  const style =
    rec === "improving"
      ? "bg-emerald-100 text-emerald-700"
      : rec === "scale"
        ? "bg-sky-100 text-sky-700"
        : rec === "worsening"
          ? "bg-red-100 text-red-700"
          : "bg-slate-100 text-slate-700";
  return (
    <span title={reason || "Sin detalle"} className={`rounded-full px-2.5 py-1 text-xs font-semibold ${style}`}>
      {label}
    </span>
  );
}

function formatUsd(amount: number) {
  return `$${Number(amount || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function getLevelLabel(level: PerfEntityType) {
  if (level === "account") return "Cuentas";
  if (level === "campaign") return "Campañas";
  if (level === "adset") return "Adsets";
  return "Ads";
}
