'use client';

/**
 * SummaryCard (Req 1.1-1.5, 1.7).
 *
 * Renders one metric with loading/error states. On error it shows an error
 * indication and retains the last successfully displayed value rather than
 * showing partial/incorrect data (Req 1.7); retention is handled by the parent.
 * An optional metric icon accents the card.
 */

import Image, { type StaticImageData } from 'next/image';

interface SummaryCardProps {
  title: string;
  value: string | number;
  isLoading?: boolean;
  isError?: boolean;
  icon?: StaticImageData;
}

export function SummaryCard({ title, value, isLoading, isError, icon }: SummaryCardProps) {
  return (
    <div className="rounded-md bg-surface p-5 ring-1 ring-border/40" data-testid="summary-card">
      <div className="flex items-center gap-2">
        {icon && (
          <Image src={icon} alt="" width={24} height={24} aria-hidden className="opacity-90" />
        )}
        <p className="text-sm text-secondary">{title}</p>
      </div>
      {isLoading ? (
        <p className="mt-2 text-2xl text-secondary" role="status">
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
