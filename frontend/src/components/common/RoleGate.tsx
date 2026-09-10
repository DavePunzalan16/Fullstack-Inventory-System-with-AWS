'use client';

/**
 * RoleGate (Req 12.7, 12.8, Property 17).
 *
 * Renders its children only when the current session role is Admin. For Staff,
 * missing, or unrecognized roles the children are absent from the DOM (not just
 * hidden), so admin-only controls are neither visible nor interactive.
 *
 * The decision is exposed as the pure {@link isAdminRole} for property testing.
 */

import { useAppSelector } from '@/state/hooks';

/** True iff the role is exactly 'admin' (Property 17). */
export function isAdminRole(role: string | null | undefined): boolean {
  return role === 'admin';
}

export function RoleGate({ children }: { children: React.ReactNode }) {
  const role = useAppSelector((s) => s.auth.user?.role);
  if (!isAdminRole(role)) {
    return null;
  }
  return <>{children}</>;
}
