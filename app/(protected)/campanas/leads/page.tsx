"use client";

import PerformanceCategoryPage from "../../../components/performance-category-page";
import LeadsEntitiesPanel from "../../../components/leads-entities-panel";
import { useLocale } from "../../../providers/LocaleProvider";

export default function LeadsPage() {
  const { locale } = useLocale();
  const isEn = locale === "en";

  return (
    <PerformanceCategoryPage
      title={isEn ? "Leads" : "Leads"}
      subtitle={isEn ? "Metrics only for adsets classified as LEADS." : "Metricas solo de adsets clasificados como LEADS."}
      resultTerm="Leads"
      resultSubtitle={isEn ? "Captured leads" : "Leads captados"}
      syncScopeSubtitle={isEn ? "Leads campaigns only." : "Solo campanas de leads."}
      metricsTable="facebook_leads_metrics"
      summaryResultField="total_leads"
      accountTable="facebook_leads_ad_account_metrics"
      accountResultField="leads_count"
      timeseriesTable="facebook_leads_timeseries"
      timeseriesResultField="leads_count"
      tooltipResultsLabel="Leads"
      syncPath="/api/facebook/metrics/sync?scope=leads"
    >
      <LeadsEntitiesPanel />
    </PerformanceCategoryPage>
  );
}
