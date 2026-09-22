'use client';

/**
 * Sign-up page (Req 11.1-11.4): email/password account creation via the API
 * (POST /auth/signup). New accounts are basic users. On success the user is
 * logged in and redirected. No Cognito dependency, so it renders in dev.
 */

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { useSignupMutation } from '@/state/api';
import { authSuccess } from '@/state/authSlice';
import { useAppDispatch } from '@/state/hooks';
import { isValidEmail } from '@/lib/validation';

export default function SignUpPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [signup, { isLoading }] = useSignupMutation();
  const [values, setValues] = useState({ email: '', password: '', name: '' });
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!isValidEmail(values.email)) { setError('Enter a valid email address.'); return; }
    if (values.password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    try {
      const { token, user } = await signup(values).unwrap();
      dispatch(authSuccess({ token, user }));
      router.replace('/');
    } catch (err) {
      const status = (err as { status?: number }).status;
      setError(status === 409 ? 'An account with this email already exists.' : 'Could not create your account.');
      setValues((v) => ({ ...v, password: '' }));
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-4xl text-white">Sign up</h1>
      <form onSubmit={submit} className="flex flex-col gap-4" aria-label="Sign up form">
        <label className="flex flex-col gap-1 text-sm text-secondary">
          Name
          <input type="text" aria-label="Name" value={values.name}
            onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
            className="rounded bg-background px-3 py-2 text-white ring-1 ring-border/40" />
        </label>
        <label className="flex flex-col gap-1 text-sm text-secondary">
          Email
          <input type="email" aria-label="Email" value={values.email}
            onChange={(e) => setValues((v) => ({ ...v, email: e.target.value }))}
            className="rounded bg-background px-3 py-2 text-white ring-1 ring-border/40" />
        </label>
        <label className="flex flex-col gap-1 text-sm text-secondary">
          Password
          <input type="password" aria-label="Password" value={values.password}
            onChange={(e) => setValues((v) => ({ ...v, password: e.target.value }))}
            className="rounded bg-background px-3 py-2 text-white ring-1 ring-border/40" />
        </label>
        {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
        <button type="submit" disabled={isLoading}
          className="rounded-full bg-primary px-6 py-2 font-bold uppercase text-black disabled:opacity-60">
          Create account
        </button>
      </form>
      <p className="text-sm text-secondary">
        Have an account? <Link href="/sign-in" className="text-primary">Sign in</Link>
      </p>
    </div>
  );
}