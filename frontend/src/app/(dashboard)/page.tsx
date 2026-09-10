'use client';

/**
 * Dashboard page (Req 1.x, 2.x): four summary cards + three charts.
 * Summary cards retain the last successfully displayed values on error (Req 1.7)
 * by keeping the last non-error `data` from the RTK Query hook.
 */

import { useEffect, useRef } from 'react';

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

  // Retain last good summary values across error states (Req 1.7).
  const lastGood = useRef<DashboardSummary>(EMPTY_SUMMARY);
  useEffect(() => {
    if (summary.isSuccess && summary.data) {
      lastGood.current = summary.data;
    }
  }, [summary.isSuccess, summary.data]);

  const s = summary.data ?? lastGood.current;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-4xl text-white">Dashboard</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard title="Total products" value={s.totalProducts} isLoading={summary.isLoading} isError={summary.isError} />
        <SummaryCard title="Total stock value" value={`$${s.totalStockValue}`} isLoading={summary.isLoading} isError={summary.isError} />
        <SummaryCard title="Low stock" value={s.lowStockCount} isLoading={summary.isLoading} isError={summary.isError} />
        <SummaryCard title="This month's expenses" value={`$${s.currentMonthExpenses}`} isLoading={summary.isLoading} isError={summary.isError} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <TrendChart data={trends.data} isLoading={trends.isLoading} isError={trends.isError} />
        <BreakdownChart data={breakdown.data} isLoading={breakdown.isLoading} isError={breakdown.isError} />
        <TopProductsChart data={popular.data} isLoading={popular.isLoading} isError={popular.isError} />
      </div>
    </div>
  );
}
