"use client";

import PerformanceCategoryPage from "../../../components/performance-category-page";
import { useLocale } from "../../../providers/LocaleProvider";

export default function VentasPage() {
  const { locale } = useLocale();
  const isEn = locale === "en";

  return (
    <PerformanceCategoryPage
      title={isEn ? "Sales" : "Ventas"}
      subtitle={
        isEn
          ? "Metrics for SALES adsets from web/catalog, excluding messaging destinations."
          : "Metricas de adsets SALES de web/catalogo, excluyendo destinos de mensajes."
      }
      resultTerm={isEn ? "Sales" : "Ventas"}
      resultSubtitle={isEn ? "Purchases / sales conversions" : "Compras / conversiones de venta"}
      syncScopeSubtitle={isEn ? "Sales campaigns only." : "Solo campanas de ventas."}
      metricsTable="facebook_sales_metrics"
      summaryResultField="total_results"
      accountTable="facebook_sales_ad_account_metrics"
      accountResultField="results_count"
      timeseriesTable="facebook_sales_timeseries"
      timeseriesResultField="results_count"
      tooltipResultsLabel={isEn ? "Sales" : "Ventas"}
    />
  );
}
