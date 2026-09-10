'use client';

/**
 * Dashboard charts (Req 2.1–2.6) built with Recharts. Each chart owns its
 * loading / error / empty state independently so one failing chart does not
 * prevent the others from rendering (Req 2.5, 2.6).
 */

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { ErrorState, LoadingState, EmptyState } from '@/components/common/States';
import type { PopularProduct, TrendBucket } from '@/types';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const COLORS = ['#c3b1ff', '#8b7ad6', '#6f5bb5', '#544091', '#3a2b6e', '#251a4d'];

interface ChartWrapperProps {
  title: string;
  isLoading?: boolean;
  isError?: boolean;
  isEmpty?: boolean;
  children: React.ReactNode;
}

function ChartCard({ title, isLoading, isError, isEmpty, children }: ChartWrapperProps) {
  return (
    <section aria-label={title} className="rounded-md bg-surface p-4">
      <h3 className="mb-2 text-sm text-offwhite">{title}</h3>
      {isLoading ? (
        <LoadingState />
      ) : isError ? (
        <ErrorState message={`${title} failed to load.`} />
      ) : isEmpty ? (
        <EmptyState message="No data for this period." />
      ) : (
        <div style={{ width: '100%', height: 260 }}>{children}</div>
      )}
    </section>
  );
}

export function TrendChart({
  data,
  isLoading,
  isError,
}: {
  data?: TrendBucket[];
  isLoading?: boolean;
  isError?: boolean;
}) {
  const rows = (data ?? []).map((b) => ({ label: MONTHS[b.month], total: b.total }));
  return (
    <ChartCard title="Stock & sales trends" isLoading={isLoading} isError={isError} isEmpty={rows.length === 0}>
      <ResponsiveContainer>
        <LineChart data={rows}>
          <CartesianGrid strokeDasharray="3 3" stroke="#484848" />
          <XAxis dataKey="label" stroke="#c7c7c7" />
          <YAxis stroke="#c7c7c7" />
          <Tooltip />
          <Line type="monotone" dataKey="total" stroke="#c3b1ff" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function BreakdownChart({
  data,
  isLoading,
  isError,
}: {
  data?: Record<string, number>;
  isLoading?: boolean;
  isError?: boolean;
}) {
  const rows = Object.entries(data ?? {}).map(([name, value]) => ({ name, value }));
  return (
    <ChartCard title="Expense breakdown" isLoading={isLoading} isError={isError} isEmpty={rows.length === 0}>
      <ResponsiveContainer>
        <PieChart>
          <Pie data={rows} dataKey="value" nameKey="name" outerRadius={90} label>
            {rows.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function TopProductsChart({
  data,
  isLoading,
  isError,
}: {
  data?: PopularProduct[];
  isLoading?: boolean;
  isError?: boolean;
}) {
  const rows = (data ?? []).map((p) => ({ name: p.name ?? p.sku ?? p.id, volume: p.salesVolume }));
  return (
    <ChartCard title="Top products" isLoading={isLoading} isError={isError} isEmpty={rows.length === 0}>
      <ResponsiveContainer>
        <BarChart data={rows}>
          <CartesianGrid strokeDasharray="3 3" stroke="#484848" />
          <XAxis dataKey="name" stroke="#c7c7c7" />
          <YAxis stroke="#c7c7c7" />
          <Tooltip />
          <Bar dataKey="volume" fill="#c3b1ff" />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
