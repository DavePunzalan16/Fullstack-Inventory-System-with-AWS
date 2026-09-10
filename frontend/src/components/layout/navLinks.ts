/**
 * Sidebar navigation links (Req 10.1): exactly five, ordered top-to-bottom.
 * `adminOnly` links (Users, Req 6.5) are hidden for non-Admin roles.
 */

export interface NavLink {
  label: string;
  href: string;
  adminOnly?: boolean;
}

/** The five ordered sidebar links. */
export const NAV_LINKS: readonly NavLink[] = [
  { label: 'Dashboard', href: '/' },
  { label: 'Products', href: '/products' },
  { label: 'Users', href: '/users', adminOnly: true },
  { label: 'Expenses', href: '/expenses' },
  { label: 'Settings', href: '/settings' },
] as const;

/** Filters the nav links visible to a given role (Req 6.5). */
export function visibleLinks(role: string | null | undefined): NavLink[] {
  return NAV_LINKS.filter((link) => !link.adminOnly || role === 'admin');
}
