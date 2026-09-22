/**
 * Auth route group layout (Batch 4): full-bleed background image with a dark
 * overlay behind a centered card, matching the landing page for a consistent
 * pre-login experience.
 */

import Image from 'next/image';

import background from '@/Assets/background.png';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden p-6">
      <Image src={background} alt="" aria-hidden fill priority className="object-cover" />
      <div className="absolute inset-0 bg-black/70" />
      <div className="relative z-10 w-full max-w-md rounded-lg bg-surface/95 p-8 shadow-xl ring-1 ring-border/40 backdrop-blur">
        {children}
      </div>
    </div>
  );
}