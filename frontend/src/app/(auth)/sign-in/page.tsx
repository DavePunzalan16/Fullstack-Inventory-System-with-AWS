'use client';

/**
 * Sign-in page (Req 11.5â€“11.7): authenticates with Cognito, stores the JWT on
 * success, shows an error and stores nothing on failure.
 */

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { DevLoginPanel } from '@/components/auth/DevLoginPanel';
import { signIn } from '@/lib/cognito';
import { useAppDispatch } from '@/state/hooks';
import { authFailure, authStart, authSuccess } from '@/state/authSlice';

export default function SignInPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    dispatch(authStart());
    try {
      const { idToken } = await signIn(email, password);
      dispatch(authSuccess({ token: idToken, user: null }));
      router.replace('/');
    } catch {
      dispatch(authFailure('Authentication failed'));
      setError('Authentication failed. Check your email and password.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-4xl text-white">Sign in</h1>
      <form onSubmit={submit} className="flex flex-col gap-4" aria-label="Sign in form">
        <label className="flex flex-col gap-1 text-sm text-offwhite">
          Email
          <input type="email" aria-label="Email" value={email} onChange={(e) => setEmail(e.target.value)}
            className="rounded bg-background px-3 py-2 text-white" />
        </label>
        <label className="flex flex-col gap-1 text-sm text-offwhite">
          Password
          <input type="password" aria-label="Password" value={password} onChange={(e) => setPassword(e.target.value)}
            className="rounded bg-background px-3 py-2 text-white" />
        </label>
        {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
        <button type="submit" disabled={submitting}
          className="rounded-full bg-primary px-6 py-2 font-bold uppercase text-black disabled:opacity-60">
          Sign in
        </button>
      </form>
      <DevLoginPanel />
      <p className="text-sm text-offwhite">
        No account? <Link href="/sign-up" className="text-primary">Sign up</Link>
      </p>
    </div>
  );
}
