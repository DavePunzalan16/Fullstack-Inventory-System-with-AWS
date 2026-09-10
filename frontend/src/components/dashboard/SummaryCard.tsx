'use client';

/**
 * SummaryCard (Req 1.1–1.5, 1.7).
 *
 * Renders one metric with loading/error/empty states. On error it shows an
 * error indication and retains the last successfully displayed value rather
 * than showing partial/incorrect data (Req 1.7). Retention is handled by the
 * parent passing the last good value; this component reflects it.
 */

interface SummaryCardProps {
  title: string;
  value: string | number;
  isLoading?: boolean;
  isError?: boolean;
}

export function SummaryCard({ title, value, isLoading, isError }: SummaryCardProps) {
  return (
    <div className="rounded-md bg-surface p-5" data-testid="summary-card">
      <p className="text-sm text-offwhite">{title}</p>
      {isLoading ? (
        <p className="mt-2 text-2xl text-offwhite" role="status">
          …
        </p>
      ) : (
        <p className="mt-2 text-3xl font-semibold text-white" data-testid="summary-value">
          {value}
        </p>
      )}
      {isError && (
        <p className="mt-1 text-xs text-red-400" role="alert">
          Failed to refresh — showing last known value.
        </p>
      )}
    </div>
  );
}
