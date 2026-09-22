'use client';

/**
 * Navbar (Req 10.3, 10.7): global search + Help button + profile; drawer toggle
 * < 768px. The Help button (distinct from the profile placeholder) is global.
 * When no user is present, the profile shows initials/placeholder while keeping
 * search and help accessible.
 */

import { HelpButton } from '@/components/layout/HelpButton';
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

      <div className="flex items-center gap-3">
        <HelpButton />
        <div className="flex items-center gap-2" data-testid="navbar-profile">
          {user ? (
            <span className="text-white">{user.name}</span>
          ) : (
            <span
              aria-label="Profile unavailable"
              data-testid="profile-placeholder"
              className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-icon-bg text-secondary"
            >
              ?
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
