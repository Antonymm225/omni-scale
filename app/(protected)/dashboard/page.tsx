"use client";

import PerformanceCategoryPage from "../../components/performance-category-page";
import { useLocale } from "../../providers/LocaleProvider";

export default function DashboardPage() {
  const { locale } = useLocale();
  const isEn = locale === "en";

  return (
    <PerformanceCategoryPage
      title="Dashboard"
      subtitle={
        isEn
          ? "Consolidated metrics for all campaigns, auto-updated every 10 minutes."
          : "Metricas consolidadas de todas las campanas, actualizadas automaticamente cada 10 minutos."
      }
      resultTerm={isEn ? "Results" : "Resultados"}
      resultSubtitle={isEn ? "Global account results" : "Resultados globales de la cuenta"}
      syncScopeSubtitle={isEn ? "Global view with no category filters." : "Vista global sin filtrar por categoria."}
      metricsTable="facebook_dashboard_metrics"
      summaryResultField="total_leads"
      accountTable="facebook_dashboard_ad_account_metrics"
      accountResultField="leads_count"
      timeseriesTable="facebook_dashboard_timeseries"
      timeseriesResultField="leads_count"
      tooltipResultsLabel={isEn ? "Results" : "Resultados"}
      onlyRunningAccounts
    />
  );
}
