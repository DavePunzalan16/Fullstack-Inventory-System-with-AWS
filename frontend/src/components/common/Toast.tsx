'use client';

/**
 * Minimal accessible toast. Auto-dismisses after a few seconds. Rendered near
 * the top-right; used to confirm create/delete actions (Req 4.9, 7.x).
 */

import { useEffect } from 'react';

export type ToastKind = 'success' | 'error';

export function Toast({
  message,
  kind = 'success',
  onClose,
  duration = 3000,
}: {
  message: string;
  kind?: ToastKind;
  onClose: () => void;
  duration?: number;
}) {
  useEffect(() => {
    const id = setTimeout(onClose, duration);
    return () => clearTimeout(id);
  }, [onClose, duration]);

  return (
    <div
      role="status"
      aria-live="polite"
      className={[
        'fixed right-4 top-4 z-[100] rounded-md px-4 py-3 text-sm font-medium shadow-lg ring-1',
        kind === 'success'
          ? 'bg-primary text-black ring-primary'
          : 'bg-red-500 text-white ring-red-600',
      ].join(' ')}
    >
      {message}
    </div>
  );
}
