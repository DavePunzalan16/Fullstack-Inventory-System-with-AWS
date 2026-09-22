'use client';

/**
 * Sign-in page (Req 11.5-11.7): email/password auth via the API (POST /auth/login).
 *
 * Uses the app''s own auth endpoint (not Cognito) so it renders and works in
 * local/dev without Cognito configuration - fixing the previous 500 that came
 * from constructing a Cognito user pool with placeholder env vars.
 */

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { DevLoginPanel } from '@/components/auth/DevLoginPanel';
import { useLoginMutation } from '@/state/api';
import { authFailure, authStart, authSuccess } from '@/state/authSlice';
import { useAppDispatch } from '@/state/hooks';

export default function SignInPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [login, { isLoading }] = useLoginMutation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    dispatch(authStart());
    try {
      const { token, user } = await login({ email, password }).unwrap();
      dispatch(authSuccess({ token, user }));
      router.replace('/');
    } catch {
      dispatch(authFailure('Authentication failed'));
      setError('Invalid email or password.');
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-4xl text-white">Sign in</h1>
      <form onSubmit={submit} className="flex flex-col gap-4" aria-label="Sign in form">
        <label className="flex flex-col gap-1 text-sm text-secondary">
          Email
          <input type="email" aria-label="Email" value={email} onChange={(e) => setEmail(e.target.value)}
            className="rounded bg-background px-3 py-2 text-white ring-1 ring-border/40" />
        </label>
        <label className="flex flex-col gap-1 text-sm text-secondary">
          Password
          <input type="password" aria-label="Password" value={password} onChange={(e) => setPassword(e.target.value)}
            className="rounded bg-background px-3 py-2 text-white ring-1 ring-border/40" />
        </label>
        {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
        <button type="submit" disabled={isLoading}
          className="rounded-full bg-primary px-6 py-2 font-bold uppercase text-black disabled:opacity-60">
          Sign in
        </button>
      </form>
      <p className="text-sm text-secondary">
        No account? <Link href="/sign-up" className="text-primary">Sign up</Link>
      </p>
      <DevLoginPanel />
    </div>
  );
}