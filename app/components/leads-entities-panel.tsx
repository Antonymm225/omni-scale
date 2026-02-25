"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useLocale } from "../providers/LocaleProvider";

type PerfEntityType = "account" | "campaign" | "adset" | "ad";
type Trend = "improving" | "stable" | "worsening";
type Health = "good" | "watch" | "bad";
type AiRecommendation = "improving" | "stable" | "scale" | "worsening" | null;
type AiAction = "none" | "scale_up" | "pause_ad" | "pause_adset" | "pause_campaign" | "pause_account" | null;

type PerfStateRow = {
  entity_type: PerfEntityType;
  entity_id: string;
  entity_name: string | null;
  facebook_ad_account_id: string;
  account_name: string | null;
  campaign_id: string | null;
  adset_id: string | null;
  ad_id: string | null;
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
  ai_action: AiAction;
  effective_status: string | null;
};

type LeadAdsetRow = {
  facebook_adset_id: string;
  campaign_id: string | null;
  facebook_ad_account_id: string;
};

export default function LeadsEntitiesPanel() {
  const { locale } = useLocale();
  const isEn = locale === "en";

  const [loading, setLoading] = useState(true);
  const [savingTarget, setSavingTarget] = useState(false);
  const [cplEnabled, setCplEnabled] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [rows, setRows] = useState<PerfStateRow[]>([]);
  const [cplTarget, setCplTarget] = useState<string>("");

  const [viewLevel, setViewLevel] = useState<PerfEntityType>("campaign");
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
      setError(isEn ? "Could not validate session." : "No se pudo validar la sesion.");
      setLoading(false);
      return;
    }

    const [adsetsRes, perfRes] = await Promise.all([
      supabase
        .from("facebook_adsets")
        .select("facebook_adset_id,campaign_id,facebook_ad_account_id")
        .eq("user_id", user.id)
        .eq("performance_type", "LEADS"),
      supabase
        .from("facebook_performance_state")
        .select(
          "entity_type,entity_id,entity_name,facebook_ad_account_id,account_name,campaign_id,adset_id,ad_id,spend_usd,results_count,cost_per_result_usd,cpm,ctr,cpc_usd,trend,health,ai_recommendation,ai_reason_short,ai_confidence_score,ai_action,effective_status"
        )
        .eq("user_id", user.id),
    ]);

    if (adsetsRes.error) {
      setError(adsetsRes.error.message);
      setLoading(false);
      return;
    }
    if (perfRes.error) {
      setError(perfRes.error.message);
      setLoading(false);
      return;
    }

    const profileRes = await supabase.from("profiles").select("leads_cpl_target_usd").eq("id", user.id).maybeSingle();
    if (!profileRes.error) {
      const raw = profileRes.data?.leads_cpl_target_usd as number | null | undefined;
      if (raw != null) setCplTarget(String(raw));
    } else {
      const message = (profileRes.error.message || "").toLowerCase();
      if (message.includes("leads_cpl_target_usd")) {
        setCplEnabled(false);
      }
    }

    const leadAdsets = (adsetsRes.data || []) as LeadAdsetRow[];
    const leadAdsetIds = new Set(leadAdsets.map((row) => row.facebook_adset_id));
    const leadCampaignIds = new Set(leadAdsets.map((row) => row.campaign_id).filter((value): value is string => Boolean(value)));
    const leadAccountIds = new Set(leadAdsets.map((row) => row.facebook_ad_account_id));

    const perfRows = ((perfRes.data || []) as PerfStateRow[]).filter((row) => {
      if (row.entity_type === "adset") return leadAdsetIds.has(row.entity_id);
      if (row.entity_type === "campaign") return leadCampaignIds.has(row.entity_id);
      if (row.entity_type === "ad") return Boolean(row.adset_id && leadAdsetIds.has(row.adset_id));
      if (row.entity_type === "account") return leadAccountIds.has(row.facebook_ad_account_id);
      return false;
    });

    setRows(perfRows.sort((a, b) => Number(b.spend_usd || 0) - Number(a.spend_usd || 0)));
    setLoading(false);
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadData();
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const saveTarget = async () => {
    if (!cplEnabled) {
      setError(
        isEn
          ? "Missing leads_cpl_target_usd column in profiles. Run the SQL migration."
          : "Falta la columna leads_cpl_target_usd en profiles. Ejecuta el SQL que te comparto abajo."
      );
      return;
    }
    setSavingTarget(true);
    setError(null);
    setNotice(null);
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      setError(isEn ? "Could not validate session." : "No se pudo validar la sesion.");
      setSavingTarget(false);
      return;
    }

    const parsed = cplTarget.trim() ? Number(cplTarget) : null;
    if (parsed != null && (Number.isNaN(parsed) || parsed < 0)) {
      setError(isEn ? "Target CPL must be a number greater than or equal to 0." : "El CPL objetivo debe ser un numero mayor o igual a 0.");
      setSavingTarget(false);
      return;
    }

    const { error } = await supabase.from("profiles").upsert(
      {
        id: user.id,
        leads_cpl_target_usd: parsed,
      },
      { onConflict: "id" }
    );

    if (error) {
      const message = (error.message || "").toLowerCase();
      if (message.includes("leads_cpl_target_usd")) {
        setCplEnabled(false);
        setError(
          isEn
            ? "Missing leads_cpl_target_usd column in profiles. Run the SQL migration."
            : "Falta la columna leads_cpl_target_usd en profiles. Ejecuta el SQL que te comparto abajo."
        );
      } else {
        setError(error.message);
      }
      setSavingTarget(false);
      return;
    }
    setNotice(isEn ? "Target CPL saved." : "CPL objetivo guardado.");
    setSavingTarget(false);
  };

  const accountRows = useMemo(() => rows.filter((row) => row.entity_type === "account"), [rows]);
  const campaignRows = useMemo(() => rows.filter((row) => row.entity_type === "campaign"), [rows]);
  const adsetRows = useMemo(() => rows.filter((row) => row.entity_type === "adset"), [rows]);
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

  const currentSelectableIds = useMemo(() => {
    if (viewLevel === "account") return currentRows.map((row) => row.facebook_ad_account_id);
    if (viewLevel === "campaign") return currentRows.map((row) => row.campaign_id || row.entity_id);
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
      }
      setSelectedAds([]);
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

  const cplTargetValue = cplTarget.trim() ? Number(cplTarget) : null;

  return (
    <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-[#111827]">{isEn ? "LEADS entities" : "Entidades LEADS"}</h2>
          <p className="mt-1 text-sm text-slate-600">
            {isEn
              ? "Campaigns, adsets, and ads classified as LEADS with AI analysis."
              : "Campañas, adsets y ads clasificados como LEADS con AI Analysis."}
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              {isEn ? "Target CPL (USD)" : "CPL objetivo (USD)"}
            </span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={cplTarget}
              onChange={(event) => setCplTarget(event.target.value)}
              placeholder={isEn ? "Ex: 3.50" : "Ej: 3.50"}
              disabled={!cplEnabled}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-[#1D293D] outline-none focus:border-[#1D293D] disabled:cursor-not-allowed disabled:bg-slate-100 sm:w-[160px]"
            />
          </label>
          <button
            type="button"
            onClick={saveTarget}
            disabled={savingTarget || !cplEnabled}
            className="inline-flex items-center justify-center rounded-lg bg-[#1D293D] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {savingTarget ? (isEn ? "Saving..." : "Guardando...") : isEn ? "Save CPL" : "Guardar CPL"}
          </button>
        </div>
      </div>

      {error ? <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
      {notice ? <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{notice}</div> : null}

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <BreadcrumbButton label={isEn ? "Accounts" : "Cuentas"} active={viewLevel === "account"} onClick={() => goToLevel("account")} />
        <span className="text-slate-300">/</span>
        <BreadcrumbButton label={isEn ? "Campaigns" : "Campañas"} active={viewLevel === "campaign"} onClick={() => goToLevel("campaign")} />
        <span className="text-slate-300">/</span>
        <BreadcrumbButton label="Adsets" active={viewLevel === "adset"} onClick={() => goToLevel("adset")} />
        <span className="text-slate-300">/</span>
        <BreadcrumbButton label="Ads" active={viewLevel === "ad"} onClick={() => goToLevel("ad")} />
      </div>

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
                  aria-label={isEn ? "Select all" : "Seleccionar todo"}
                />
              </th>
              <th className="pb-3 pr-4 font-semibold">{isEn ? "Entity" : "Entidad"}</th>
              <th className="pb-3 pr-4 font-semibold">{isEn ? "Spend (USD)" : "Gasto (USD)"}</th>
              <th className="pb-3 pr-4 font-semibold">Leads</th>
              <th className="pb-3 pr-4 font-semibold">{isEn ? "Cost (USD)" : "Costo (USD)"}</th>
              <th className="pb-3 pr-4 font-semibold">CPM</th>
              <th className="pb-3 pr-4 font-semibold">CPC</th>
              <th className="pb-3 pr-4 font-semibold">CTR</th>
              <th className="pb-3 pr-4 font-semibold">AI Analysis</th>
              <th className="pb-3 pr-4 font-semibold">Confidence</th>
              <th className="pb-3 font-semibold">{isEn ? "Status" : "Estado"}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={11} className="py-5 text-sm text-slate-500">
                  {isEn ? "Loading entities..." : "Cargando entidades..."}
                </td>
              </tr>
            ) : currentRows.length === 0 ? (
              <tr>
                <td colSpan={11} className="py-5 text-sm text-slate-500">
                  {isEn ? "No LEADS data for this view." : "Sin datos LEADS para esta vista."}
                </td>
              </tr>
            ) : (
              currentRows.map((row) => {
                const selectableId =
                  viewLevel === "account"
                    ? row.facebook_ad_account_id
                    : viewLevel === "campaign"
                      ? row.campaign_id || row.entity_id
                      : viewLevel === "adset"
                        ? row.adset_id || row.entity_id
                        : row.ad_id || row.entity_id;
                const checked = selectedCurrentSet.has(selectableId);

                const alertByTarget =
                  cplTargetValue != null &&
                  !Number.isNaN(cplTargetValue) &&
                  cplTargetValue > 0 &&
                  row.cost_per_result_usd != null &&
                  Number(row.cost_per_result_usd) > cplTargetValue;

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
                      <button type="button" onClick={() => drillDown(row)} disabled={viewLevel === "ad"} className="text-left disabled:cursor-default">
                        <p className="text-sm font-semibold text-[#111827] underline decoration-transparent underline-offset-2 hover:decoration-[#1D293D] hover:text-[#1D293D]">
                          {row.entity_name || (isEn ? "No name" : "Sin nombre")}
                        </p>
                        <p className="text-xs text-slate-500">
                          {row.account_name || (isEn ? "No account" : "Sin cuenta")} - {row.entity_id}
                        </p>
                      </button>
                    </td>
                    <td className="py-3 pr-4 text-sm font-semibold text-[#1D293D]">{formatUsd(row.spend_usd)}</td>
                    <td className="py-3 pr-4 text-sm text-[#1D293D]">{row.results_count}</td>
                    <td className="py-3 pr-4 text-sm text-[#1D293D]">{row.cost_per_result_usd != null ? formatUsd(row.cost_per_result_usd) : "-"}</td>
                    <td className="py-3 pr-4 text-sm text-[#1D293D]">{row.cpm != null ? Number(row.cpm).toFixed(2) : "-"}</td>
                    <td className="py-3 pr-4 text-sm text-[#1D293D]">{row.cpc_usd != null ? formatUsd(row.cpc_usd) : "-"}</td>
                    <td className="py-3 pr-4 text-sm text-[#1D293D]">{row.ctr != null ? `${Number(row.ctr).toFixed(2)}%` : "-"}</td>
                    <td className="py-3 pr-4 text-sm text-[#1D293D]"><AiAnalysisPill row={row} alertByTarget={alertByTarget} cplTargetValue={cplTargetValue} isEn={isEn} /></td>
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
  );
}

function toggleInArray(items: string[], id: string) {
  return items.includes(id) ? items.filter((item) => item !== id) : [...items, id];
}

function BreadcrumbButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold ${active ? "bg-[#1D293D] text-white" : "text-slate-600 hover:bg-slate-100"}`}>
      {label}
    </button>
  );
}

function AiAnalysisPill({
  row,
  alertByTarget,
  cplTargetValue,
  isEn,
}: {
  row: PerfStateRow;
  alertByTarget: boolean;
  cplTargetValue: number | null;
  isEn: boolean;
}) {
  if (alertByTarget) {
    const reason = `${isEn ? "Above target CPL" : "Sobre CPL objetivo"} (${formatUsd(cplTargetValue || 0)}). ${row.ai_reason_short || ""}`.trim();
    return <span title={reason} className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700">{isEn ? "CPL Alert" : "Alerta CPL"}</span>;
  }

  const rec = row.ai_recommendation || "stable";
  const label = rec === "improving" ? (isEn ? "Improving" : "Mejorando") : rec === "scale" ? (isEn ? "Scale" : "Escalar") : rec === "worsening" ? (isEn ? "Worsening" : "Empeorando") : isEn ? "Stable" : "Estable";
  const style = rec === "improving" ? "bg-emerald-100 text-emerald-700" : rec === "scale" ? "bg-sky-100 text-sky-700" : rec === "worsening" ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-700";

  const reason = `${row.ai_reason_short || (isEn ? "No details" : "Sin detalle")}${row.ai_action && row.ai_action !== "none" ? ` | ${mapAiAction(row.ai_action, isEn)}` : ""}`;
  return <span title={reason} className={`rounded-full px-2.5 py-1 text-xs font-semibold ${style}`}>{label}</span>;
}

function mapAiAction(action: AiAction, isEn: boolean) {
  if (action === "pause_ad") return isEn ? "Suggestion: pause ad" : "Sugerencia: pausar ad";
  if (action === "pause_adset") return isEn ? "Suggestion: pause adset" : "Sugerencia: pausar adset";
  if (action === "pause_campaign") return isEn ? "Suggestion: pause campaign" : "Sugerencia: pausar campaña";
  if (action === "pause_account") return isEn ? "Suggestion: pause account" : "Sugerencia: pausar cuenta";
  if (action === "scale_up") return isEn ? "Suggestion: scale" : "Sugerencia: escalar";
  return isEn ? "No suggestion" : "Sin sugerencia";
}

function formatUsd(amount: number) {
  return `$${Number(amount || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
