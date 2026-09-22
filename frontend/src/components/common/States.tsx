'use client';

/**
 * Shared loading / error / empty state presentational components
 * (Req 1.7, 2.5, 2.6, 6.2, 6.3, 7.2, 7.4).
 *
 * ErrorState distinguishes an unreachable API (fetch/network error, or an RTK
 * Query FetchError with no HTTP status) from a server-side failure, and can
 * render a Retry button wired to an RTK Query refetch. EmptyState is for the
 * "request succeeded but there is no data yet" case, which is a different
 * situation from an error and must not look identical.
 */

import Image from 'next/image';

import syncflow from '@/Assets/syncflow.png';

/** True when an RTK Query error represents an unreachable API rather than a 4xx/5xx. */
export function isConnectionError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const e = error as { status?: unknown };
  // RTK Query uses status 'FETCH_ERROR' / 'TIMEOUT_ERROR' when the request never
  // reached the server (API down, CORS, DNS). Numeric status means the server replied.
  return e.status === 'FETCH_ERROR' || e.status === 'TIMEOUT_ERROR';
}

export function LoadingState({ label = 'Loading…' }: { label?: string }) {
  return (
    <div role="status" aria-live="polite" className="flex items-center gap-2 p-4 text-secondary">
      <Image src={syncflow} alt="" width={20} height={20} className="animate-pulse" aria-hidden />
      {label}
    </div>
  );
}

interface ErrorStateProps {
  message?: string;
  /** The RTK Query error, used to tailor the message (unreachable vs server error). */
  error?: unknown;
  /** When provided, renders a Retry button that calls this (RTK Query refetch). */
  onRetry?: () => void;
}

export function ErrorState({ message, error, onRetry }: ErrorStateProps) {
  const connection = isConnectionError(error);
  const text =
    message ??
    (connection
      ? 'Cannot reach the API. Make sure the backend is running (see start-local.ps1).'
      : 'Something went wrong loading this data.');

  return (
    <div role="alert" className="flex flex-col items-start gap-2 p-4">
      <span className="text-red-400">{text}</span>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="rounded-full bg-primary px-4 py-1.5 text-sm font-bold uppercase text-black"
        >
          Retry
        </button>
      )}
    </div>
  );
}

export function EmptyState({
  message = 'Nothing to show.',
  illustration,
  illustrationAlt = '',
}: {
  message?: string;
  illustration?: import('next/image').StaticImageData;
  illustrationAlt?: string;
}) {
  return (
    <div
      className="flex flex-col items-center gap-3 p-8 text-center text-secondary"
      data-testid="empty-state"
    >
      {illustration && (
        <Image
          src={illustration}
          alt={illustrationAlt}
          width={160}
          height={160}
          className="rounded-lg bg-surface/40 p-3 opacity-90"
        />
      )}
      <span>{message}</span>
    </div>
  );
}
