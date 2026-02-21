"use client";

import PerformanceCategoryPage from "../../components/performance-category-page";

export default function DashboardPage() {
  return (
    <PerformanceCategoryPage
      title="Dashboard"
      subtitle="Metricas consolidadas de todas las campanas, actualizadas automaticamente cada 10 minutos."
      resultTerm="Resultados"
      resultSubtitle="Resultados globales de la cuenta"
      syncScopeSubtitle="Vista global sin filtrar por categoria."
      metricsTable="facebook_dashboard_metrics"
      summaryResultField="total_leads"
      accountTable="facebook_dashboard_ad_account_metrics"
      accountResultField="leads_count"
      timeseriesTable="facebook_dashboard_timeseries"
      timeseriesResultField="leads_count"
    />
  );
}

