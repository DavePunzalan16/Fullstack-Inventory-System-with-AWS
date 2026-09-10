'use client';

/**
 * Shared loading / error / empty state presentational components
 * (Req 1.7, 2.5, 2.6, 6.2, 6.3, 7.2, 7.4).
 */

export function LoadingState({ label = 'Loading…' }: { label?: string }) {
  return (
    <div role="status" aria-live="polite" className="p-4 text-offwhite">
      {label}
    </div>
  );
}

export function ErrorState({ message = 'Something went wrong.' }: { message?: string }) {
  return (
    <div role="alert" className="p-4 text-red-400">
      {message}
    </div>
  );
}

export function EmptyState({ message = 'Nothing to show.' }: { message?: string }) {
  return (
    <div className="p-4 text-offwhite" data-testid="empty-state">
      {message}
    </div>
  );
}
