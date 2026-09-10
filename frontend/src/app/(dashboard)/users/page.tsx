'use client';

/**
 * Users page (Req 6.1–6.3, 6.6): lists name/email/role for Admins; redirects
 * Staff (or unauthenticated) users to the dashboard, without showing content.
 */

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { EmptyState, ErrorState, LoadingState } from '@/components/common/States';
import { useAppSelector } from '@/state/hooks';
import { useGetUsersQuery } from '@/state/api';

export default function UsersPage() {
  const router = useRouter();
  const role = useAppSelector((s) => s.auth.user?.role);
  const isAdmin = role === 'admin';

  useEffect(() => {
    if (role !== undefined && !isAdmin) {
      router.replace('/');
    }
  }, [role, isAdmin, router]);

  const { data, isLoading, isError } = useGetUsersQuery(undefined, { skip: !isAdmin });

  if (!isAdmin) {
    return null; // Staff never sees Users content (Req 6.6).
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-4xl text-white">Users</h1>
      {isLoading ? (
        <LoadingState />
      ) : isError ? (
        <ErrorState message="The user list could not be loaded." />
      ) : (data ?? []).length === 0 ? (
        <EmptyState message="No users are available." />
      ) : (
        <table className="w-full text-left text-sm text-offwhite">
          <thead>
            <tr className="border-b border-dark-gray text-white">
              <th className="py-2">Name</th>
              <th>Email</th>
              <th>Role</th>
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((u) => (
              <tr key={u.id} className="border-b border-dark-gray/50">
                <td className="py-2">{u.name}</td>
                <td>{u.email}</td>
                <td className="capitalize">{u.role}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
