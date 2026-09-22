'use client';

/**
 * Navbar (Req 10.3, 10.7, Batch 4): search + guest banner + Help + auth controls.
 * Logged in -> user email + Logout; guest/anon -> Login link. The guest banner
 * appears when browsing in read-only guest mode.
 */

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { GuestBanner } from '@/components/layout/GuestBanner';
import { HelpButton } from '@/components/layout/HelpButton';
import { GlobalSearchBar } from '@/components/search/GlobalSearchBar';
import { signOut } from '@/state/authSlice';
import { useAppDispatch, useAppSelector } from '@/state/hooks';
import { toggleSidebar } from '@/state/layoutSlice';

export function Navbar() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const user = useAppSelector((s) => s.auth.user);

  const handleLogout = () => {
    dispatch(signOut());
    router.replace('/');
  };

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
        <GuestBanner />
        <HelpButton />
        {user ? (
          <div className="flex items-center gap-2" data-testid="navbar-profile">
            <span className="hidden text-sm text-white sm:inline">{user.email}</span>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-full bg-icon-bg px-4 py-1.5 text-sm font-semibold text-secondary hover:text-white"
            >
              Logout
            </button>
          </div>
        ) : (
          <Link
            href="/sign-in"
            data-testid="navbar-login"
            className="rounded-full bg-primary px-4 py-1.5 text-sm font-bold uppercase text-black"
          >
            Login
          </Link>
        )}
      </div>
    </header>
  );
}