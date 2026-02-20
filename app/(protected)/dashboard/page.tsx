"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

type DashboardMetrics = {
  active_accounts_count: number;
  active_ads_count: number;
  total_spend_usd: number;
  source_date: string;
  last_synced_at: string;
};

type AdAccountMetric = {
  facebook_ad_account_id: string;
  account_id: string | null;
  account_name: string | null;
  active_ads_count: number;
  is_active_account: boolean;
  spend_original: number;
  currency: string | null;
  spend_usd: number;
};

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [accountRows, setAccountRows] = useState<AdAccountMetric[]>([]);

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

    const [metricsRes, accountsRes] = await Promise.all([
      supabase
        .from("facebook_dashboard_metrics")
        .select("active_accounts_count,active_ads_count,total_spend_usd,source_date,last_synced_at")
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase
        .from("facebook_dashboard_ad_account_metrics")
        .select(
          "facebook_ad_account_id,account_id,account_name,active_ads_count,is_active_account,spend_original,currency,spend_usd"
        )
        .eq("user_id", user.id)
        .eq("is_active_account", true)
        .order("is_active_account", { ascending: false })
        .order("spend_usd", { ascending: false }),
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

    setMetrics((metricsRes.data as DashboardMetrics | null) || null);
    setAccountRows((accountsRes.data as AdAccountMetric[]) || []);
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
              Métricas cacheadas desde Meta, actualizadas automáticamente cada 10 minutos.
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
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
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
            <section className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <MetricCard
                title="Cuentas activas"
                value={metrics?.active_accounts_count ?? 0}
                subtitle="Con campaña activa y ads activos"
              />
              <MetricCard
                title="Gasto total hoy (USD)"
                value={`$${Number(metrics?.total_spend_usd ?? 0).toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}`}
                subtitle="Suma de gasto diario por ad account"
              />
              <MetricCard
                title="Ads activos"
                value={metrics?.active_ads_count ?? 0}
                subtitle="Total de anuncios en ejecución"
              />
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
                      <th className="pb-3 font-semibold">Gasto día (divisa)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {accountRows.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="py-6 text-sm text-slate-500">
                          Aún no hay ad accounts sincronizadas para hoy.
                        </td>
                      </tr>
                    ) : (
                      accountRows.map((row) => (
                        <tr key={row.facebook_ad_account_id} className="border-b border-slate-100 last:border-b-0">
                          <td className="py-3 pr-4">
                            <p className="text-sm font-semibold text-[#111827]">
                              {row.account_name || "Sin nombre"}
                            </p>
                            <p className="text-xs text-slate-500">
                              ID: {row.account_id || row.facebook_ad_account_id}
                            </p>
                          </td>
                          <td className="py-3 pr-4 text-sm text-[#1D293D]">{row.active_ads_count}</td>
                          <td className="py-3 text-sm font-semibold text-[#1D293D]">
                            {formatLocalCurrency(row.spend_original || 0, row.currency)}
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
