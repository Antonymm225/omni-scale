"use client";

import PerformanceCategoryPage from "../../../components/performance-category-page";

export default function BrandingPage() {
  return (
    <PerformanceCategoryPage
      title="Branding"
      subtitle="Metricas de adsets clasificados como AWARENESS (likes, follows, engagement, video views)."
      resultTerm="Branding"
      resultSubtitle="Engagement / views / likes / follows"
      syncScopeSubtitle="Solo campanas de branding."
      metricsTable="facebook_branding_metrics"
      summaryResultField="total_results"
      accountTable="facebook_branding_ad_account_metrics"
      accountResultField="results_count"
      timeseriesTable="facebook_branding_timeseries"
      timeseriesResultField="results_count"
    />
  );
}

