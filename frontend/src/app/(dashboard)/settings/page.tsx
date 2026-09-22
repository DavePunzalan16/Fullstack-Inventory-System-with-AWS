'use client';

/**
 * Settings page (Req 9.1, 9.2, 9.6, 12.7, 12.8, Batch 3).
 *
 * - Logged out: prompt to sign in (no error).
 * - Admin: Edit profile (email + password, current password required to change
 *   the password) via PATCH /users/me, plus the Theme toggle.
 * - Basic user (staff): Theme toggle only.
 */

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

import cloudshield from '@/Assets/cloudshield.png';
import { Toast } from '@/components/common/Toast';
import { useUpdateProfileMutation } from '@/state/api';
import { setUser } from '@/state/authSlice';
import { useAppDispatch, useAppSelector } from '@/state/hooks';
import { setTheme } from '@/state/themeSlice';

function ThemeSection() {
  const dispatch = useAppDispatch();
  const mode = useAppSelector((s) => s.theme.mode);
  const persistenceFailed = useAppSelector((s) => s.theme.persistenceFailed);
  return (
    <section aria-label="Theme" className="rounded-md bg-surface p-4 ring-1 ring-border/40">
      <h2 className="mb-3 flex items-center gap-2 text-white">
        <Image src={cloudshield} alt="" width={24} height={24} aria-hidden />
        Theme &amp; appearance
      </h2>
      <div role="radiogroup" aria-label="Theme mode" className="flex gap-3">
        {(['dark', 'light'] as const).map((option) => (
          <button key={option} type="button" role="radio" aria-checked={mode === option}
            onClick={() => dispatch(setTheme(option))}
            className={['rounded-full px-6 py-2 font-bold uppercase', mode === option ? 'bg-primary text-black' : 'bg-icon-bg text-secondary'].join(' ')}>
            {option}
          </button>
        ))}
      </div>
      {persistenceFailed && (
        <p role="alert" className="mt-3 text-sm text-red-400">
          Your theme preference could not be saved, but it will apply for this session.
        </p>
      )}
    </section>
  );
}

function EditProfileSection() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const [updateProfile, { isLoading }] = useUpdateProfileMutation();
  const [email, setEmail] = useState(user?.email ?? '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const body: { email?: string; newPassword?: string; currentPassword?: string } = {};
    if (email && email !== user?.email) body.email = email;
    if (newPassword) { body.newPassword = newPassword; body.currentPassword = currentPassword; }
    if (!body.email && !body.newPassword) { setError('Change your email or set a new password first.'); return; }
    try {
      const updated = await updateProfile(body).unwrap();
      dispatch(setUser(updated));
      setToast('Profile updated.');
      setCurrentPassword(''); setNewPassword('');
    } catch (err) {
      const status = (err as { status?: number }).status;
      setError(status === 401 ? 'Current password is incorrect.' : status === 409 ? 'That email is already in use.' : 'Could not update your profile.');
    }
  };

  return (
    <section aria-label="Edit profile" className="rounded-md bg-surface p-4 ring-1 ring-border/40">
      <h2 className="mb-3 text-white">Edit profile</h2>
      <form onSubmit={save} className="flex max-w-md flex-col gap-3">
        <label className="flex flex-col gap-1 text-sm text-secondary">
          Email
          <input type="email" aria-label="Email" value={email} onChange={(e) => setEmail(e.target.value)}
            className="rounded bg-background px-3 py-2 text-white ring-1 ring-border/40" />
        </label>
        <label className="flex flex-col gap-1 text-sm text-secondary">
          Current password (required to change password)
          <input type="password" aria-label="Current password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)}
            className="rounded bg-background px-3 py-2 text-white ring-1 ring-border/40" />
        </label>
        <label className="flex flex-col gap-1 text-sm text-secondary">
          New password
          <input type="password" aria-label="New password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
            className="rounded bg-background px-3 py-2 text-white ring-1 ring-border/40" />
        </label>
        {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
        <button type="submit" disabled={isLoading}
          className="rounded-full bg-primary px-6 py-2 font-bold uppercase text-black disabled:opacity-60">
          Save changes
        </button>
      </form>
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </section>
  );
}

export default function SettingsPage() {
  const user = useAppSelector((s) => s.auth.user);
  const isGuest = useAppSelector((s) => s.auth.isGuest);

  return (
    <div className="flex min-h-[70vh] flex-col gap-6">
      <h1 className="font-display text-4xl text-white">Settings</h1>

      {/* Theme is available to everyone, including guests. */}
      <ThemeSection />

      {/* Profile editing is admin-only. */}
      {user?.role === 'admin' && <EditProfileSection />}

      {/* Guests / logged-out users get a gentle prompt (no error). */}
      {!user && (
        <section className="rounded-md bg-surface p-4 ring-1 ring-border/40">
          <p className="text-sm text-secondary">
            {isGuest ? 'You are browsing as a guest. ' : ''}
            <Link href="/sign-in" className="text-primary">Log in</Link> to edit your profile.
          </p>
        </section>
      )}

      {/* Hidden author credit (subtle, bottom of page). */}
      <footer className="mt-auto pt-8">
        <a
          href="https://dm-punzalan-portfolio2026.vercel.app/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-secondary/60 underline underline-offset-2 hover:text-secondary"
        >
          Site by Dave Matthew Punzalan
        </a>
      </footer>
    </div>
  );
}