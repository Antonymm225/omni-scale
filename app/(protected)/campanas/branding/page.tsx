"use client";

import PerformanceCategoryPage from "../../../components/performance-category-page";
import { useLocale } from "../../../providers/LocaleProvider";

export default function BrandingPage() {
  const { locale } = useLocale();
  const isEn = locale === "en";

  return (
    <PerformanceCategoryPage
      title="Branding"
      subtitle={
        isEn
          ? "Metrics for adsets classified as AWARENESS (likes, follows, engagement, video views)."
          : "Metricas de adsets clasificados como AWARENESS (likes, follows, engagement, video views)."
      }
      resultTerm="Branding"
      resultSubtitle={isEn ? "Engagement / views / likes / follows" : "Engagement / views / likes / follows"}
      syncScopeSubtitle={isEn ? "Branding campaigns only." : "Solo campanas de branding."}
      metricsTable="facebook_branding_metrics"
      summaryResultField="total_results"
      accountTable="facebook_branding_ad_account_metrics"
      accountResultField="results_count"
      timeseriesTable="facebook_branding_timeseries"
      timeseriesResultField="results_count"
      tooltipResultsLabel={isEn ? "Results" : "Resultados"}
    />
  );
}
