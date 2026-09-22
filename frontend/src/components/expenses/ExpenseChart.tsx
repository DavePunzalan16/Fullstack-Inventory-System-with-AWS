'use client';

/**
 * ExpenseChart (Req 7.6): total expense amount grouped by category.
 *
 * Consumes the API''s GET /expenses/by-category response, which is a
 * Record<string, number> mapping category -> summed amount. The error state
 * surfaces only on a real API failure and offers Retry; an empty object shows
 * a friendly empty state, not an error.
 */

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

import { EmptyState, ErrorState, LoadingState } from '@/components/common/States';

const COLORS = ['#c3b1ff', '#8b7ad6', '#6f5bb5', '#544091', '#3a2b6e', '#251a4d', '#8884d8'];

export function ExpenseChart({
  data,
  isLoading,
  isError,
  error,
  onRetry,
}: {
  data?: Record<string, number>;
  isLoading?: boolean;
  isError?: boolean;
  error?: unknown;
  onRetry?: () => void;
}) {
  const rows = Object.entries(data ?? {}).map(([name, value]) => ({ name, value }));

  if (isLoading) return <LoadingState label="Loading chart…" />;
  if (isError) return <ErrorState error={error} onRetry={onRetry} message={onRetry ? undefined : 'Expense chart failed to load.'} />;
  if (rows.length === 0) return <EmptyState message="No expenses to chart yet." />;

  return (
    <section aria-label="Expenses by category" className="rounded-md bg-surface p-4 ring-1 ring-border/40">
      <div style={{ width: '100%', height: 280 }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie data={rows} dataKey="value" nameKey="name" outerRadius={100} label>
              {rows.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
