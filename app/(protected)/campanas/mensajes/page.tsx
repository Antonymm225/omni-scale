"use client";

import PerformanceCategoryPage from "../../../components/performance-category-page";
import { useLocale } from "../../../providers/LocaleProvider";

export default function MensajesPage() {
  const { locale } = useLocale();
  const isEn = locale === "en";

  return (
    <PerformanceCategoryPage
      title={isEn ? "Messages" : "Mensajes"}
      subtitle={
        isEn
          ? "Metrics only for adsets classified as MESSAGING."
          : "Metricas solo de adsets clasificados como MESSAGING."
      }
      resultTerm={isEn ? "Messages" : "Mensajes"}
      resultSubtitle={isEn ? "Conversations started" : "Conversaciones iniciadas"}
      syncScopeSubtitle={isEn ? "Messages campaigns only." : "Solo campanas de mensajes."}
      metricsTable="facebook_messages_metrics"
      summaryResultField="total_results"
      accountTable="facebook_messages_ad_account_metrics"
      accountResultField="results_count"
      timeseriesTable="facebook_messages_timeseries"
      timeseriesResultField="results_count"
      tooltipResultsLabel={isEn ? "Messages" : "Mensajes"}
    />
  );
}
