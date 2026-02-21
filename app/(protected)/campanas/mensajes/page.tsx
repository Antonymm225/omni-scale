"use client";

import PerformanceCategoryPage from "../../../components/performance-category-page";

export default function MensajesPage() {
  return (
    <PerformanceCategoryPage
      title="Mensajes"
      subtitle="Metricas solo de adsets clasificados como MESSAGING."
      resultTerm="Mensajes"
      resultSubtitle="Conversaciones iniciadas"
      syncScopeSubtitle="Solo campanas de mensajes."
      metricsTable="facebook_messages_metrics"
      summaryResultField="total_results"
      accountTable="facebook_messages_ad_account_metrics"
      accountResultField="results_count"
      timeseriesTable="facebook_messages_timeseries"
      timeseriesResultField="results_count"
    />
  );
}

