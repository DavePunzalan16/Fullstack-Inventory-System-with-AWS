'use client';

/**
 * Landing page at "/" (Batch 4, Task 32).
 *
 * Standalone entry point shown to everyone (logged in or not) - no sidebar/nav.
 * Full-bleed background image with a bottom gradient overlay for readability,
 * hero headline, one-line subheadline, and three CTAs: Login, Register, and
 * Continue as Guest (which enters the app in read-only guest mode).
 */

import Image from 'next/image';
import { useRouter } from 'next/navigation';

import background from '@/Assets/background.png';
import taglogo from '@/Assets/taglogo.png';
import { enterGuestMode } from '@/state/authSlice';
import { useAppDispatch } from '@/state/hooks';

export default function LandingPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const continueAsGuest = () => {
    dispatch(enterGuestMode());
    router.push('/dashboard');
  };

  return (
    <main className="relative min-h-screen w-full overflow-hidden">
      {/* Full-viewport background */}
      <Image
        src={background}
        alt=""
        aria-hidden
        priority
        fill
        className="object-cover"
      />
      {/* Bottom-weighted gradient overlay for text contrast */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/30" />

      {/* Logo top-left */}
      <div className="absolute left-6 top-6 z-10 flex items-center gap-2">
        <Image src={taglogo} alt="DMP Inventory logo" width={36} height={36} className="rounded" />
        <span className="font-display text-2xl tracking-wide text-white">DMP</span>
      </div>

      {/* Hero content */}
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <h1 className="font-display text-5xl font-bold uppercase tracking-wide text-white drop-shadow-lg sm:text-6xl md:text-7xl">
          DMP Inventory System
        </h1>
        <p className="mt-5 max-w-2xl text-base text-white/85 sm:text-lg">
          Full-stack inventory, product, and expense management built on a modern, cloud-inspired architecture.
        </p>

        <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => router.push('/sign-in')}
            className="w-56 rounded-full bg-primary px-8 py-3 font-bold uppercase tracking-wide text-black transition hover:brightness-110 sm:w-auto"
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => router.push('/sign-up')}
            className="w-56 rounded-full border border-primary bg-transparent px-8 py-3 font-bold uppercase tracking-wide text-primary transition hover:bg-primary/10 sm:w-auto"
          >
            Register
          </button>
          <button
            type="button"
            onClick={continueAsGuest}
            className="w-56 rounded-full bg-white/10 px-8 py-3 font-bold uppercase tracking-wide text-white ring-1 ring-white/30 transition hover:bg-white/20 sm:w-auto"
          >
            Continue as Guest
          </button>
        </div>
      </div>
    </main>
  );
}