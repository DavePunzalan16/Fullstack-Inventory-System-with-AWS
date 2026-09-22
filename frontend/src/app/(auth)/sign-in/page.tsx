'use client';

/**
 * Sign-in page (Req 11.5-11.7, Batch 4 polish): email/password via POST /auth/login.
 *
 * Inline field validation before submit, show/hide password, a distinct error
 * banner for wrong credentials vs a network/server error, and a loading state
 * that prevents double-submit. Redirects to the dashboard on success.
 */

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';

import { DevLoginPanel } from '@/components/auth/DevLoginPanel';
import { isValidEmail } from '@/lib/validation';
import { useLoginMutation } from '@/state/api';
import { authFailure, authStart, authSuccess } from '@/state/authSlice';
import { useAppDispatch } from '@/state/hooks';

function SignInForm() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [login, { isLoading }] = useLoginMutation();
  const searchParams = useSearchParams();
  const justCreated = searchParams.get('created') === '1';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [banner, setBanner] = useState<{ kind: 'credentials' | 'network'; text: string } | null>(null);

  const validate = () => {
    const errs: { email?: string; password?: string } = {};
    if (!isValidEmail(email)) errs.email = 'Enter a valid email address.';
    if (!password) errs.password = 'Password is required.';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBanner(null);
    if (!validate()) return;
    dispatch(authStart());
    try {
      const { token, user } = await login({ email, password }).unwrap();
      dispatch(authSuccess({ token, user }));
      router.replace('/dashboard');
    } catch (err) {
      const status = (err as { status?: number | string }).status;
      dispatch(authFailure('Authentication failed'));
      if (status === 401) {
        setBanner({ kind: 'credentials', text: 'Incorrect email or password.' });
      } else if (status === 'FETCH_ERROR' || status === 'TIMEOUT_ERROR') {
        setBanner({ kind: 'network', text: 'Cannot reach the server. Please try again.' });
      } else {
        setBanner({ kind: 'network', text: 'Something went wrong. Please try again.' });
      }
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-4xl text-white">Sign in</h1>

      {justCreated && !banner && (
        <div role="status" className="rounded-md bg-green-500/15 px-3 py-2 text-sm text-green-300 ring-1 ring-green-500/30">
          Account created. Please log in.
        </div>
      )}
      {banner && (
        <div role="alert" className={['rounded-md px-3 py-2 text-sm', banner.kind === 'credentials' ? 'bg-red-500/15 text-red-300 ring-1 ring-red-500/30' : 'bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30'].join(' ')}>
          {banner.text}
        </div>
      )}

      <form onSubmit={submit} className="flex flex-col gap-4" aria-label="Sign in form" noValidate>
        <label className="flex flex-col gap-1 text-sm text-secondary">
          Email
          <input type="email" aria-label="Email" value={email} onChange={(e) => setEmail(e.target.value)}
            aria-invalid={!!fieldErrors.email}
            className="rounded bg-background px-3 py-2 text-white ring-1 ring-border/40" />
          {fieldErrors.email && <span role="alert" className="text-xs text-red-400">{fieldErrors.email}</span>}
        </label>

        <label className="flex flex-col gap-1 text-sm text-secondary">
          Password
          <div className="relative">
            <input type={showPassword ? 'text' : 'password'} aria-label="Password" value={password}
              onChange={(e) => setPassword(e.target.value)} aria-invalid={!!fieldErrors.password}
              className="w-full rounded bg-background px-3 py-2 pr-16 text-white ring-1 ring-border/40" />
            <button type="button" onClick={() => setShowPassword((s) => !s)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-semibold text-primary">
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
          {fieldErrors.password && <span role="alert" className="text-xs text-red-400">{fieldErrors.password}</span>}
        </label>

        <button type="submit" disabled={isLoading}
          className="rounded-full bg-primary px-6 py-2 font-bold uppercase text-black disabled:opacity-60">
          {isLoading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>

      <p className="text-sm text-secondary">
        Don&apos;t have an account? <Link href="/sign-up" className="text-primary">Register</Link>
      </p>
      <DevLoginPanel />
    </div>
  );
}


export default function SignInPage() {
  return (
    <Suspense fallback={<div className="text-secondary">Loading...</div>}>
      <SignInForm />
    </Suspense>
  );
}
