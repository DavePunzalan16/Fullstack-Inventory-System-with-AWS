'use client';

/** Low-stock visual indicator for product rows (Req 3.6). */
export function LowStockBadge() {
  return (
    <span
      data-testid="low-stock-badge"
      className="rounded-full bg-red-500/20 px-2 py-0.5 text-xs font-semibold text-red-300"
    >
      Low stock
    </span>
  );
}
