'use client';

/**
 * DevLoginPanel: local-only quick sign-in (shown when NEXT_PUBLIC_AUTH_MODE=dev).
 *
 * Calls the API /auth/dev-login to obtain a token + seeded user, stores the
 * session, and navigates to the dashboard. Lets you exercise admin/staff
 * features locally without configuring AWS Cognito. Renders nothing outside
 * dev mode, so it is safe to leave mounted.
 */

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { useDevLoginMutation } from '@/state/api';
import { authSuccess } from '@/state/authSlice';
import { useAppDispatch } from '@/state/hooks';

const DEV_MODE = process.env.NEXT_PUBLIC_AUTH_MODE === 'dev';

export function DevLoginPanel() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [devLogin, { isLoading }] = useDevLoginMutation();
  const [error, setError] = useState<string | null>(null);

  if (!DEV_MODE) return null;

  const loginAs = async (role: 'admin' | 'staff') => {
    setError(null);
    try {
      const { token, user } = await devLogin({ role }).unwrap();
      dispatch(authSuccess({ token, user }));
      router.replace('/');
    } catch {
      setError('Dev login failed. Is the API running with AUTH_MODE=dev?');
    }
  };

  return (
    <div className="mt-6 rounded-md border border-dark-gray bg-background p-4">
      <p className="mb-3 text-sm text-offwhite">
        Local development login (no AWS Cognito needed):
      </p>
      <div className="flex gap-3">
        <button
          type="button"
          disabled={isLoading}
          onClick={() => loginAs('admin')}
          className="rounded-full bg-primary px-6 py-2 font-bold uppercase text-black disabled:opacity-60"
        >
          Log in as Admin
        </button>
        <button
          type="button"
          disabled={isLoading}
          onClick={() => loginAs('staff')}
          className="rounded-full bg-icon-bg px-6 py-2 font-bold uppercase text-offwhite disabled:opacity-60"
        >
          Log in as Staff
        </button>
      </div>
      {error && <p role="alert" className="mt-2 text-sm text-red-400">{error}</p>}
    </div>
  );
}
