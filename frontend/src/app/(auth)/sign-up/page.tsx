'use client';

/**
 * Sign-up page (Req 11.1–11.4): email/password/name with client validation.
 * Retains entered values except the password on error, shows per-field errors,
 * and handles the account-already-exists case.
 */

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { signUp } from '@/lib/cognito';
import { validateSignUp, type FieldErrors } from '@/lib/validation';

type SignUpFields = { email: string; password: string; name: string };

export default function SignUpPage() {
  const router = useRouter();
  const [values, setValues] = useState<SignUpFields>({ email: '', password: '', name: '' });
  const [errors, setErrors] = useState<FieldErrors<SignUpFields>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const fieldErrors = validateSignUp(values);
    setErrors(fieldErrors);
    if (Object.keys(fieldErrors).length > 0) return;

    setSubmitting(true);
    try {
      await signUp(values.email, values.password, values.name);
      router.replace('/sign-in');
    } catch (err) {
      const message = err instanceof Error ? err.message : '';
      if (/exist|already/i.test(message)) {
        setFormError('An account with this email already exists.');
      } else {
        setFormError('Could not create your account. Please try again.');
      }
      // Retain entered values except the password (Req 11.3).
      setValues((v) => ({ ...v, password: '' }));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-4xl text-white">Sign up</h1>
      <form onSubmit={submit} className="flex flex-col gap-4" aria-label="Sign up form">
        <label className="flex flex-col gap-1 text-sm text-offwhite">
          Name
          <input type="text" aria-label="Name" value={values.name}
            onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
            className="rounded bg-background px-3 py-2 text-white" />
          {errors.name && <span role="alert" className="text-xs text-red-400">{errors.name}</span>}
        </label>
        <label className="flex flex-col gap-1 text-sm text-offwhite">
          Email
          <input type="email" aria-label="Email" value={values.email}
            onChange={(e) => setValues((v) => ({ ...v, email: e.target.value }))}
            className="rounded bg-background px-3 py-2 text-white" />
          {errors.email && <span role="alert" className="text-xs text-red-400">{errors.email}</span>}
        </label>
        <label className="flex flex-col gap-1 text-sm text-offwhite">
          Password
          <input type="password" aria-label="Password" value={values.password}
            onChange={(e) => setValues((v) => ({ ...v, password: e.target.value }))}
            className="rounded bg-background px-3 py-2 text-white" />
          {errors.password && <span role="alert" className="text-xs text-red-400">{errors.password}</span>}
        </label>
        {formError && <p role="alert" className="text-sm text-red-400">{formError}</p>}
        <button type="submit" disabled={submitting}
          className="rounded-full bg-primary px-6 py-2 font-bold uppercase text-black disabled:opacity-60">
          Create account
        </button>
      </form>
      <p className="text-sm text-offwhite">
        Have an account? <Link href="/sign-in" className="text-primary">Sign in</Link>
      </p>
    </div>
  );
}
