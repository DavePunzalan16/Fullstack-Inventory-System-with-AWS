'use client';

/**
 * Global search bar + results dropdown (Req 8.1–8.6).
 *
 * Debounced input; queries only when >=2 chars (dropdown hidden otherwise).
 * Shows up to 10 results, a no-results indication, or an error indication that
 * preserves the user's query. All data flows through RTK Query (Req 15.4).
 */

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import { useLazySearchProductsQuery } from '@/state/api';

const DEBOUNCE_MS = 300;
const MIN_CHARS = 2;

export function GlobalSearchBar() {
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [trigger, result] = useLazySearchProductsQuery();

  // Debounce the input.
  useEffect(() => {
    const id = setTimeout(() => setDebounced(query.trim()), DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [query]);

  // Query only at/after the minimum length.
  useEffect(() => {
    if (debounced.length >= MIN_CHARS) {
      trigger(debounced);
    }
  }, [debounced, trigger]);

  const showDropdown = debounced.length >= MIN_CHARS;
  const results = useMemo(() => (result.data ?? []).slice(0, 10), [result.data]);

  return (
    <div className="relative w-full max-w-md">
      <input
        type="search"
        aria-label="Search products"
        placeholder="Search products by name or SKU"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full rounded bg-surface px-3 py-2 text-white"
      />
      {showDropdown && (
        <div
          role="listbox"
          aria-label="Search results"
          className="absolute z-50 mt-1 w-full rounded bg-surface shadow"
        >
          {result.isError && (
            <div role="alert" className="p-3 text-red-400">
              Search failed. Try again.
            </div>
          )}
          {!result.isError && result.isSuccess && results.length === 0 && (
            <div className="p-3 text-offwhite" data-testid="search-no-results">
              No products match your search.
            </div>
          )}
          {!result.isError &&
            results.map((p) => (
              <Link
                key={p.id}
                href={`/products/${p.id}`}
                role="option"
                aria-selected={false}
                className="block px-3 py-2 text-white hover:bg-icon-bg"
              >
                {p.name} <span className="text-offwhite">({p.sku})</span>
              </Link>
            ))}
        </div>
      )}
    </div>
  );
}
