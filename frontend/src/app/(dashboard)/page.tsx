'use client';

/**
 * Dashboard page (Req 1.x, 2.x): hero banner, four summary cards, three charts.
 * Summary cards retain the last successfully displayed values on error (Req 1.7).
 * Each chart shows a connection-aware error with Retry (refetch) on failure.
 */

import Image from 'next/image';
import { useEffect, useRef } from 'react';

import architecture from '@/Assets/architecture.png';
import metricsIcon from '@/Assets/metrics.png';
import { SummaryCard } from '@/components/dashboard/SummaryCard';
import { BreakdownChart, TopProductsChart, TrendChart } from '@/components/dashboard/Charts';
import {
  useGetDashboardSummaryQuery,
  useGetExpenseBreakdownQuery,
  useGetPopularProductsQuery,
  useGetTrendsQuery,
} from '@/state/api';
import type { DashboardSummary } from '@/types';

const EMPTY_SUMMARY: DashboardSummary = {
  totalProducts: 0,
  totalStockValue: '0.00',
  lowStockCount: 0,
  currentMonthExpenses: '0.00',
};

export default function DashboardPage() {
  const summary = useGetDashboardSummaryQuery();
  const trends = useGetTrendsQuery();
  const breakdown = useGetExpenseBreakdownQuery();
  const popular = useGetPopularProductsQuery();

  const lastGood = useRef<DashboardSummary>(EMPTY_SUMMARY);
  useEffect(() => {
    if (summary.isSuccess && summary.data) {
      lastGood.current = summary.data;
    }
  }, [summary.isSuccess, summary.data]);

  const s = summary.data ?? lastGood.current;

  return (
    <div className="flex flex-col gap-6">
      <section className="relative overflow-hidden rounded-xl bg-surface ring-1 ring-border/40">
        <Image
          src={architecture}
          alt="System architecture overview"
          className="h-40 w-full object-cover opacity-80 md:h-52"
          priority
        />
        <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/60 to-transparent p-6">
          <h1 className="font-display text-4xl text-white drop-shadow">Dashboard</h1>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard title="Total products" value={s.totalProducts} icon={metricsIcon} isLoading={summary.isLoading} isError={summary.isError} />
        <SummaryCard title="Total stock value" value={`$${s.totalStockValue}`} icon={metricsIcon} isLoading={summary.isLoading} isError={summary.isError} />
        <SummaryCard title="Low stock" value={s.lowStockCount} icon={metricsIcon} isLoading={summary.isLoading} isError={summary.isError} />
        <SummaryCard title="This month's expenses" value={`$${s.currentMonthExpenses}`} icon={metricsIcon} isLoading={summary.isLoading} isError={summary.isError} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <TrendChart data={trends.data} isLoading={trends.isLoading} isError={trends.isError} error={trends.error} onRetry={trends.refetch} />
        <BreakdownChart data={breakdown.data} isLoading={breakdown.isLoading} isError={breakdown.isError} error={breakdown.error} onRetry={breakdown.refetch} />
        <TopProductsChart data={popular.data} isLoading={popular.isLoading} isError={popular.isError} error={popular.error} onRetry={popular.refetch} />
      </div>
    </div>
  );
}
