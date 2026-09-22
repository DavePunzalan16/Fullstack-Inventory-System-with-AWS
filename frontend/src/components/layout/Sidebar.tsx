'use client';

/**
 * Sidebar (Req 10.1, 10.2, 10.4, 10.5, 6.5).
 *
 * Renders the five ordered links (Users hidden for non-Admins), indicates the
 * active link, and collapses into a toggleable drawer below 768px driven by the
 * layout slice.
 */

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { useAppDispatch, useAppSelector } from '@/state/hooks';
import { setSidebarOpen } from '@/state/layoutSlice';
import cloudstack from '@/Assets/cloudstack.png';
import { visibleLinks } from './navLinks';

export function Sidebar() {
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const role = useAppSelector((s) => s.auth.user?.role);
  const isOpen = useAppSelector((s) => s.layout.isSidebarOpen);
  const links = visibleLinks(role);

  return (
    <nav
      aria-label="Primary"
      data-open={isOpen}
      className={[
        'flex flex-col gap-2 bg-surface p-4 w-60 shrink-0',
        // Drawer behavior < 768px: hidden by default, shown when open.
        'max-md:fixed max-md:inset-y-0 max-md:left-0 max-md:z-40 max-md:transition-transform',
        isOpen ? 'max-md:translate-x-0' : 'max-md:-translate-x-full',
      ].join(' ')}
    >
      <div className="mb-4 flex items-center gap-2">
        <Image src={cloudstack} alt="" width={32} height={32} className="rounded" aria-hidden />
        <span className="font-display text-3xl text-white">Inventory</span>
      </div>
      {links.map((link) => {
        const isActive =
          link.href === '/' ? pathname === '/' : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={isActive ? 'page' : undefined}
            onClick={() => dispatch(setSidebarOpen(false))}
            className={[
              'rounded px-3 py-2 text-offwhite hover:text-white',
              isActive ? 'bg-icon-bg text-white font-semibold' : '',
            ].join(' ')}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
