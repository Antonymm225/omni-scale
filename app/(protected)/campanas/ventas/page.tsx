"use client";

import PerformanceCategoryPage from "../../../components/performance-category-page";

export default function VentasPage() {
  return (
    <PerformanceCategoryPage
      title="Ventas"
      subtitle="Metricas de adsets SALES de web/catalogo, excluyendo destinos de mensajes."
      resultTerm="Ventas"
      resultSubtitle="Compras / conversiones de venta"
      syncScopeSubtitle="Solo campanas de ventas."
      metricsTable="facebook_sales_metrics"
      summaryResultField="total_results"
      accountTable="facebook_sales_ad_account_metrics"
      accountResultField="results_count"
      timeseriesTable="facebook_sales_timeseries"
      timeseriesResultField="results_count"
    />
  );
}

