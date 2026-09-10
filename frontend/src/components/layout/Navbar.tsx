'use client';

/**
 * Navbar (Req 10.3, 10.7): global search + profile; drawer toggle < 768px.
 * Falls back to a placeholder profile indicator when the user is unavailable
 * (Req 10.7) while preserving access to the search bar.
 */

import { GlobalSearchBar } from '@/components/search/GlobalSearchBar';
import { useAppDispatch, useAppSelector } from '@/state/hooks';
import { toggleSidebar } from '@/state/layoutSlice';

export function Navbar() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);

  return (
    <header className="flex items-center gap-4 border-b border-dark-gray bg-background px-4 py-3">
      <button
        type="button"
        aria-label="Toggle navigation"
        onClick={() => dispatch(toggleSidebar())}
        className="md:hidden rounded bg-surface px-3 py-2 text-white"
      >
        ☰
      </button>

      <div className="flex-1">
        <GlobalSearchBar />
      </div>

      <div className="flex items-center gap-2" data-testid="navbar-profile">
        {user ? (
          <span className="text-white">{user.name}</span>
        ) : (
          <span
            aria-label="Profile unavailable"
            data-testid="profile-placeholder"
            className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-icon-bg text-offwhite"
          >
            ?
          </span>
        )}
      </div>
    </header>
  );
}
