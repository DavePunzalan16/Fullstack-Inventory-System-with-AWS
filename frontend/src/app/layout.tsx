import type { Metadata } from 'next';
import { Bebas_Neue, Manrope } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

/*
 * Fonts per the design system: Bebas Neue for display headings, Manrope for
 * body/UI text. Loaded via next/font for zero layout shift and exposed as CSS
 * variables that the Tailwind @theme font-display / font-body utilities consume.
 */
const bebasNeue = Bebas_Neue({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-display',
});

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-body',
});

export const metadata: Metadata = {
  title: 'Inventory Management Dashboard',
  description: 'Full-stack inventory, expense, and analytics dashboard.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Dark theme is the default per the design system (Req 9.5).
  return (
    <html lang="en" className={`${bebasNeue.variable} ${manrope.variable}`} data-theme="dark">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
