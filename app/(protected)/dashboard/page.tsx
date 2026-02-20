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

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadMetrics = async () => {
      setLoading(true);
      setError(null);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        if (mounted) {
          setError("No se pudo validar la sesión.");
          setLoading(false);
        }
        return;
      }

      const { data, error: metricsError } = await supabase
        .from("facebook_dashboard_metrics")
        .select("active_accounts_count,active_ads_count,total_spend_usd,source_date,last_synced_at")
        .eq("user_id", user.id)
        .maybeSingle();

      if (metricsError) {
        if (mounted) {
          setError(metricsError.message);
          setLoading(false);
        }
        return;
      }

      if (!mounted) return;
      setMetrics((data as DashboardMetrics | null) || null);
      setLoading(false);
    };

    void loadMetrics();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <main className="px-4 py-8 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <header>
          <h1 className="text-3xl font-bold text-[#111827] sm:text-4xl">Dashboard</h1>
          <p className="mt-2 text-base text-slate-600">
            Métricas cacheadas desde Meta, actualizadas automáticamente cada 10 minutos.
          </p>
        </header>

        {error && (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : (
          <>
            <section className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <MetricCard
                title="Cuentas activas"
                value={metrics?.active_accounts_count ?? 0}
                subtitle="Con campañas, adsets y ads activos"
              />
              <MetricCard
                title="Gasto total hoy (USD)"
                value={`$${Number(metrics?.total_spend_usd ?? 0).toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}`}
                subtitle="Divisa unificada"
              />
              <MetricCard
                title="Ads activos"
                value={metrics?.active_ads_count ?? 0}
                subtitle="Total de anuncios en ejecución"
              />
            </section>

            <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-600">
                Última sincronización: {metrics?.last_synced_at
                  ? new Date(metrics.last_synced_at).toLocaleString("es-PE")
                  : "Aún no hay datos"}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Fecha de gasto consultada: {metrics?.source_date || "-"}
              </p>
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
