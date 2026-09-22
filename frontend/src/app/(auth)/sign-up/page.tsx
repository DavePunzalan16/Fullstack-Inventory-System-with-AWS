'use client';

/**
 * Sign-up page (Req 11.1-11.4, Batch 4 polish): email/password via POST /auth/signup.
 *
 * Inline validation, show/hide password, distinct error banner, loading state,
 * and a cross-link to sign-in. On success, redirects to sign-in with an
 * "account created" message (keeps auth flow simple and explicit).
 */

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { isValidEmail } from '@/lib/validation';
import { useSignupMutation } from '@/state/api';

export default function SignUpPage() {
  const router = useRouter();
  const [signup, { isLoading }] = useSignupMutation();

  const [values, setValues] = useState({ name: '', email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [banner, setBanner] = useState<string | null>(null);

  const validate = () => {
    const errs: { email?: string; password?: string } = {};
    if (!isValidEmail(values.email)) errs.email = 'Enter a valid email address.';
    if (values.password.length < 6) errs.password = 'Password must be at least 6 characters.';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBanner(null);
    if (!validate()) return;
    try {
      await signup(values).unwrap();
      router.replace('/sign-in?created=1');
    } catch (err) {
      const status = (err as { status?: number | string }).status;
      if (status === 409) setBanner('An account with this email already exists.');
      else if (status === 'FETCH_ERROR' || status === 'TIMEOUT_ERROR') setBanner('Cannot reach the server. Please try again.');
      else setBanner('Could not create your account. Please try again.');
      setValues((v) => ({ ...v, password: '' }));
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-4xl text-white">Register</h1>

      {banner && (
        <div role="alert" className="rounded-md bg-red-500/15 px-3 py-2 text-sm text-red-300 ring-1 ring-red-500/30">
          {banner}
        </div>
      )}

      <form onSubmit={submit} className="flex flex-col gap-4" aria-label="Sign up form" noValidate>
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
            aria-invalid={!!fieldErrors.email}
            className="rounded bg-background px-3 py-2 text-white ring-1 ring-border/40" />
          {fieldErrors.email && <span role="alert" className="text-xs text-red-400">{fieldErrors.email}</span>}
        </label>

        <label className="flex flex-col gap-1 text-sm text-secondary">
          Password
          <div className="relative">
            <input type={showPassword ? 'text' : 'password'} aria-label="Password" value={values.password}
              onChange={(e) => setValues((v) => ({ ...v, password: e.target.value }))}
              aria-invalid={!!fieldErrors.password}
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
          {isLoading ? 'Creating...' : 'Create account'}
        </button>
      </form>

      <p className="text-sm text-secondary">
        Already have an account? <Link href="/sign-in" className="text-primary">Sign in</Link>
      </p>
    </div>
  );
}