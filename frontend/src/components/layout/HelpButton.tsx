'use client';

/**
 * HelpButton + HelpDrawer (Req 10.3, 10.7).
 *
 * A global help affordance in the header (distinct from the profile
 * placeholder). Clicking opens an accessible slide-over drawer with a
 * "Getting started" section and keyboard shortcuts. Closes on Escape or
 * backdrop click.
 */

import Image from 'next/image';
import { useEffect, useState } from 'react';

import vectoricon from '@/Assets/vectoricon.png';

export function HelpButton() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        aria-label="Open help"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-icon-bg text-primary ring-1 ring-border/40 hover:brightness-110"
      >
        <Image src={vectoricon} alt="" width={18} height={18} aria-hidden />
      </button>

      {open && (
        <div className="fixed inset-0 z-[95] flex justify-end bg-black/50" onClick={() => setOpen(false)}>
          <aside
            role="dialog"
            aria-modal="true"
            aria-label="Help"
            onClick={(e) => e.stopPropagation()}
            className="flex h-full w-full max-w-sm flex-col gap-5 overflow-y-auto bg-surface p-6 shadow-xl ring-1 ring-border/40"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">Help</h2>
              <button type="button" aria-label="Close help" onClick={() => setOpen(false)}
                className="rounded-full bg-icon-bg px-3 py-1 text-secondary hover:text-white">
                ✕
              </button>
            </div>

            <section>
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-primary">Getting started</h3>
              <ul className="list-disc space-y-2 pl-5 text-sm text-secondary">
                <li><strong className="text-white">Add a product:</strong> go to Products and click “Add Product” (admins only). Fill in name, SKU, category, quantity, price, and low-stock threshold, then save.</li>
                <li><strong className="text-white">Log an expense:</strong> go to Expenses and click “Add Expense”. Pick a category, enter a positive amount and date, add an optional note, then save.</li>
                <li><strong className="text-white">Track stock:</strong> the Dashboard shows totals, low-stock counts, trends, and top products, refreshing as you add data.</li>
                <li><strong className="text-white">Switch theme:</strong> use Settings to toggle light/dark; your choice is remembered.</li>
              </ul>
            </section>

            <section>
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-primary">Keyboard shortcuts</h3>
              <ul className="space-y-1 text-sm text-secondary">
                <li><kbd className="rounded bg-icon-bg px-1.5 py-0.5">Esc</kbd> — close dialogs and this help panel</li>
                <li><kbd className="rounded bg-icon-bg px-1.5 py-0.5">Tab</kbd> — move between form fields</li>
              </ul>
            </section>

            <p className="mt-auto text-xs text-secondary">
              Need the app to show data? Make sure the API is running (see start-local.ps1).
            </p>
          </aside>
        </div>
      )}
    </>
  );
}
