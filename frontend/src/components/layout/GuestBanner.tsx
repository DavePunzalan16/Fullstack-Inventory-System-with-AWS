'use client';

/**
 * GuestBanner (Batch 4, Task 33): a persistent header badge shown when browsing
 * in read-only guest mode, with a quick link back to sign-in.
 */

import Link from 'next/link';

import { useAppSelector } from '@/state/hooks';

export function GuestBanner() {
  const isGuest = useAppSelector((s) => s.auth.isGuest);
  if (!isGuest) return null;

  return (
    <div
      role="status"
      data-testid="guest-banner"
      className="flex items-center gap-2 rounded-full bg-primary/15 px-3 py-1 text-xs text-primary ring-1 ring-primary/30"
    >
      <span>Guest mode - log in to make changes</span>
      <Link href="/sign-in" className="font-semibold underline">
        Log in
      </Link>
    </div>
  );
}