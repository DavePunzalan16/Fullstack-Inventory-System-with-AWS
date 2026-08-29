/**
 * Dashboard aggregation service (Req 1.x, 2.x, Properties 1–7).
 *
 * All aggregations are pure exported functions operating on plain data so they
 * can be property-tested without a database. Prisma-backed wrappers fetch rows
 * and delegate to these helpers.
 */

import { round2, categoryBreakdown, type ExpenseLike } from './expense.service';
import { isLowStock, type ProductLike } from './product.service';
import { prisma } from '../lib/prisma';

/** Product shape for value/count aggregations. */
export interface DashboardProduct extends ProductLike {
  readonly price: number;
}

/** Total product count (Property 1). Always a non-negative integer. */
export function totalProducts(products: readonly unknown[]): number {
  return products.length;
}

/** Total stock value = Σ(price × stockQuantity), 2dp (Property 2). */
export function totalStockValue(products: readonly DashboardProduct[]): number {
  const sum = products.reduce((acc, p) => acc + p.price * p.stockQuantity, 0);
  return round2(sum);
}

/** Count of low-stock products (Property 3). */
export function lowStockCount(products: readonly ProductLike[]): number {
  return products.filter(isLowStock).length;
}

/** True if a date falls within the calendar month of `ref` (default now). */
export function isInCurrentMonth(date: Date, ref: Date = new Date()): boolean {
  return (
    date.getUTCFullYear() === ref.getUTCFullYear() &&
    date.getUTCMonth() === ref.getUTCMonth()
  );
}

/** Sum of expense amounts within the current calendar month, 2dp (Property 4). */
export function currentMonthExpenses(
  expenses: readonly (ExpenseLike & { date: Date })[],
  ref: Date = new Date(),
): number {
  const sum = expenses
    .filter((e) => isInCurrentMonth(e.date, ref))
    .reduce((acc, e) => acc + e.amount, 0);
  return round2(sum);
}

/** A single monthly trend bucket. */
export interface TrendBucket {
  readonly year: number;
  readonly month: number; // 0-11
  readonly total: number;
}

/** A movement with a timestamp and signed quantity. */
export interface TrendMovement {
  readonly createdAt: Date;
  readonly quantity: number;
}

/**
 * Buckets movements into exactly 12 chronological monthly buckets covering the
 * most recent 12 months ending in `ref`'s month (Property 5). Each bucket's
 * total is the sum of quantities within that month.
 */
export function twelveMonthTrend(
  movements: readonly TrendMovement[],
  ref: Date = new Date(),
): TrendBucket[] {
  const buckets: TrendBucket[] = [];
  const base = Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth(), 1);

  for (let i = 11; i >= 0; i--) {
    const d = new Date(base);
    d.setUTCMonth(d.getUTCMonth() - i);
    const year = d.getUTCFullYear();
    const month = d.getUTCMonth();
    const total = movements
      .filter(
        (m) =>
          m.createdAt.getUTCFullYear() === year &&
          m.createdAt.getUTCMonth() === month,
      )
      .reduce((acc, m) => acc + m.quantity, 0);
    buckets.push({ year, month, total: round2(total) });
  }
  return buckets;
}

/** A product with an aggregated sales volume. */
export interface RankedProduct {
  readonly id: string;
  readonly salesVolume: number;
}

/**
 * Top-5 products by sales volume, descending (Property 7). Returns at most 5,
 * containing exactly the true top-5 (ties broken by id for determinism).
 */
export function topProducts<T extends RankedProduct>(products: readonly T[]): T[] {
  return [...products]
    .sort((a, b) => b.salesVolume - a.salesVolume || a.id.localeCompare(b.id))
    .slice(0, 5);
}

// ---- Prisma-backed wrappers ------------------------------------------------

/** Aggregated summary cards within the 2s budget (Req 1.1–1.4, 1.6). */
export async function getSummary() {
  const [products, expenses] = await Promise.all([
    prisma.product.findMany({ select: { price: true, stockQuantity: true, reorderThreshold: true } }),
    prisma.expense.findMany({ select: { amount: true, date: true } }),
  ]);

  const mappedProducts: DashboardProduct[] = products.map((p) => ({
    price: Number(p.price),
    stockQuantity: p.stockQuantity,
    reorderThreshold: p.reorderThreshold,
  }));
  const mappedExpenses = expenses.map((e) => ({
    category: '',
    amount: Number(e.amount),
    date: e.date,
  }));

  return {
    totalProducts: totalProducts(mappedProducts),
    totalStockValue: totalStockValue(mappedProducts).toFixed(2),
    lowStockCount: lowStockCount(mappedProducts),
    currentMonthExpenses: currentMonthExpenses(mappedExpenses).toFixed(2),
  };
}

/** Monthly sales/stock trends for the last 12 months (Req 2.1). */
export async function getTrends() {
  const movements = await prisma.stockMovement.findMany({
    select: { createdAt: true, quantity: true },
  });
  return twelveMonthTrend(movements);
}

/** Expense breakdown by category (Req 2.2). */
export async function getExpenseBreakdown(): Promise<Record<string, number>> {
  const expenses = await prisma.expense.findMany({
    select: { category: true, amount: true },
  });
  return categoryBreakdown(
    expenses.map((e) => ({ category: e.category, amount: Number(e.amount) })),
  );
}

/** Top 5 products by sales volume, descending (Req 2.3). */
export async function getPopularProducts() {
  // Sales volume = sum of |quantity| for 'sale' movements per product.
  const sales = await prisma.stockMovement.groupBy({
    by: ['productId'],
    where: { type: 'sale' },
    _sum: { quantity: true },
  });
  const ranked: RankedProduct[] = sales.map((s) => ({
    id: s.productId,
    salesVolume: Math.abs(Number(s._sum.quantity ?? 0)),
  }));
  const top = topProducts(ranked);

  const products = await prisma.product.findMany({
    where: { id: { in: top.map((t) => t.id) } },
    select: { id: true, name: true, sku: true },
  });
  const byId = new Map(products.map((p) => [p.id, p]));
  return top.map((t) => ({
    ...byId.get(t.id),
    id: t.id,
    salesVolume: t.salesVolume,
  }));
}
