'use client';

/**
 * Settings page (Req 9.1, 9.2, 9.6): theme toggle with exactly two options
 * (dark/light) applied app-wide without reload. Surfaces a message if the
 * preference could not be persisted.
 */

import { useAppDispatch, useAppSelector } from '@/state/hooks';
import { setTheme } from '@/state/themeSlice';

export default function SettingsPage() {
  const dispatch = useAppDispatch();
  const mode = useAppSelector((s) => s.theme.mode);
  const persistenceFailed = useAppSelector((s) => s.theme.persistenceFailed);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-4xl text-white">Settings</h1>

      <section aria-label="Theme" className="rounded-md bg-surface p-4">
        <h2 className="mb-3 text-white">Theme</h2>
        <div role="radiogroup" aria-label="Theme mode" className="flex gap-3">
          {(['dark', 'light'] as const).map((option) => (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={mode === option}
              onClick={() => dispatch(setTheme(option))}
              className={[
                'rounded-full px-6 py-2 font-bold uppercase',
                mode === option ? 'bg-primary text-black' : 'bg-icon-bg text-offwhite',
              ].join(' ')}
            >
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
    </div>
  );
}
