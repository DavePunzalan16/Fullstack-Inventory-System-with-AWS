/**
 * Layout for the authenticated dashboard route group: wraps pages in the app
 * shell (sidebar + navbar).
 */

import { AppShell } from '@/components/layout/AppShell';

export default function DashboardGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell>{children}</AppShell>;
}
