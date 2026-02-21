"use client";

import PerformanceCategoryPage from "../../../components/performance-category-page";

export default function LeadsPage() {
  return (
    <PerformanceCategoryPage
      title="Leads"
      subtitle="Metricas solo de adsets clasificados como LEADS."
      resultTerm="Leads"
      resultSubtitle="Leads captados"
      syncScopeSubtitle="Solo campanas de leads."
      metricsTable="facebook_leads_metrics"
      summaryResultField="total_leads"
      accountTable="facebook_leads_ad_account_metrics"
      accountResultField="leads_count"
      timeseriesTable="facebook_leads_timeseries"
      timeseriesResultField="leads_count"
      tooltipResultsLabel="Leads"
    />
  );
}
