'use client';

/**
 * Dashboard charts (Req 2.1-2.6) built with Recharts. Each chart owns its
 * loading / error / empty state independently so one failing chart does not
 * prevent the others from rendering (Req 2.5, 2.6). Errors distinguish an
 * unreachable API from a server error and offer Retry.
 */

import Image, { type StaticImageData } from 'next/image';
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

import trendIcon from '@/Assets/trendchart.png';
import { ErrorState, LoadingState, EmptyState } from '@/components/common/States';
import type { PopularProduct, TrendBucket } from '@/types';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const COLORS = ['#c3b1ff', '#8b7ad6', '#6f5bb5', '#544091', '#3a2b6e', '#251a4d'];

interface ChartWrapperProps {
  title: string;
  icon?: StaticImageData;
  isLoading?: boolean;
  isError?: boolean;
  isEmpty?: boolean;
  error?: unknown;
  onRetry?: () => void;
  children: React.ReactNode;
}

function ChartCard({ title, icon, isLoading, isError, isEmpty, error, onRetry, children }: ChartWrapperProps) {
  return (
    <section aria-label={title} className="rounded-md bg-surface p-4 ring-1 ring-border/40">
      <h3 className="mb-2 flex items-center gap-2 text-sm text-secondary">
        {icon && <Image src={icon} alt="" width={18} height={18} aria-hidden />}
        {title}
      </h3>
      {isLoading ? (
        <LoadingState />
      ) : isError ? (
        <ErrorState error={error} onRetry={onRetry} message={onRetry ? undefined : `${title} failed to load.`} />
      ) : isEmpty ? (
        <EmptyState message="No data for this period." />
      ) : (
        <div style={{ width: '100%', height: 260 }}>{children}</div>
      )}
    </section>
  );
}

interface ChartProps<T> {
  data?: T;
  isLoading?: boolean;
  isError?: boolean;
  error?: unknown;
  onRetry?: () => void;
}

export function TrendChart({ data, isLoading, isError, error, onRetry }: ChartProps<TrendBucket[]>) {
  const rows = (data ?? []).map((b) => ({ label: MONTHS[b.month], total: b.total }));
  return (
    <ChartCard title="Stock & sales trends" icon={trendIcon} isLoading={isLoading} isError={isError} error={error} onRetry={onRetry} isEmpty={rows.length === 0}>
      <ResponsiveContainer>
        <LineChart data={rows}>
          <CartesianGrid strokeDasharray="3 3" stroke="#484848" />
          <XAxis dataKey="label" stroke="#9a91ad" />
          <YAxis stroke="#9a91ad" />
          <Tooltip />
          <Line type="monotone" dataKey="total" stroke="#c3b1ff" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function BreakdownChart({ data, isLoading, isError, error, onRetry }: ChartProps<Record<string, number>>) {
  const rows = Object.entries(data ?? {}).map(([name, value]) => ({ name, value }));
  return (
    <ChartCard title="Expense breakdown" isLoading={isLoading} isError={isError} error={error} onRetry={onRetry} isEmpty={rows.length === 0}>
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

export function TopProductsChart({ data, isLoading, isError, error, onRetry }: ChartProps<PopularProduct[]>) {
  const rows = (data ?? []).map((p) => ({ name: p.name ?? p.sku ?? p.id, volume: p.salesVolume }));
  return (
    <ChartCard title="Top products" isLoading={isLoading} isError={isError} error={error} onRetry={onRetry} isEmpty={rows.length === 0}>
      <ResponsiveContainer>
        <BarChart data={rows}>
          <CartesianGrid strokeDasharray="3 3" stroke="#484848" />
          <XAxis dataKey="name" stroke="#9a91ad" />
          <YAxis stroke="#9a91ad" />
          <Tooltip />
          <Bar dataKey="volume" fill="#c3b1ff" />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
