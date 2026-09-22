/**
 * Property-based tests for dashboard aggregations (Properties 1–7).
 * Each property is a single fast-check test with 100+ iterations.
 */

import fc from 'fast-check';

import {
  currentMonthExpenses,
  isInCurrentMonth,
  lowStockCount,
  topProducts,
  totalProducts,
  totalStockValue,
  twelveMonthTrend,
  type DashboardProduct,
} from './dashboard.service';
import { isLowStock, type ProductLike } from './product.service';
import { round2 } from './expense.service';

const RUNS = { numRuns: 200 };

const productArb = fc.record({
  price: fc.double({ min: 0, max: 1_000_000, noNaN: true }),
  stockQuantity: fc.integer({ min: 0, max: 999_999 }),
  reorderThreshold: fc.integer({ min: 0, max: 999_999 }),
});

// Feature: inventory-management-dashboard, Property 1: Product count aggregation
test('Property 1: totalProducts equals count and is a non-negative integer', () => {
  fc.assert(
    fc.property(fc.array(productArb), (products) => {
      const n = totalProducts(products);
      return Number.isInteger(n) && n >= 0 && n === products.length;
    }),
    RUNS,
  );
});

// Feature: inventory-management-dashboard, Property 2: Total stock value aggregation
test('Property 2: totalStockValue equals Σ(price×stock) rounded to 2dp; 0.00 for empty', () => {
  fc.assert(
    fc.property(fc.array(productArb), (products: DashboardProduct[]) => {
      const expected = round2(
        products.reduce((acc, p) => acc + p.price * p.stockQuantity, 0),
      );
      return totalStockValue(products) === expected;
    }),
    RUNS,
  );
  expect(totalStockValue([])).toBe(0);
});

// Feature: inventory-management-dashboard, Property 3: Low-stock predicate and count
test('Property 3: low-stock iff stock<=threshold, and count matches predicate', () => {
  fc.assert(
    fc.property(fc.array(productArb), (products: ProductLike[]) => {
      const expected = products.filter(
        (p) => p.stockQuantity <= p.reorderThreshold,
      ).length;
      const predicateOk = products.every(
        (p) => isLowStock(p) === (p.stockQuantity <= p.reorderThreshold),
      );
      return predicateOk && lowStockCount(products) === expected;
    }),
    RUNS,
  );
});

const expenseArb = fc.record({
  category: fc.constant(''),
  amount: fc.double({ min: 0, max: 1_000_000, noNaN: true }),
  date: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }),
});

// Feature: inventory-management-dashboard, Property 4: Current-month expense aggregation
test('Property 4: currentMonthExpenses sums only current-month amounts (2dp)', () => {
  fc.assert(
    fc.property(
      fc.array(expenseArb),
      fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }),
      (expenses, ref) => {
        const expected = round2(
          expenses
            .filter((e) => isInCurrentMonth(e.date, ref))
            .reduce((acc, e) => acc + e.amount, 0),
        );
        return currentMonthExpenses(expenses, ref) === expected;
      },
    ),
    RUNS,
  );
});

const movementArb = fc.record({
  createdAt: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }),
  quantity: fc.integer({ min: -1000, max: 1000 }),
});

// Feature: inventory-management-dashboard, Property 5: Twelve-month trend bucketing
test('Property 5: exactly 12 chronological monthly buckets with correct totals', () => {
  fc.assert(
    fc.property(
      fc.array(movementArb),
      fc.date({ min: new Date('2021-01-01'), max: new Date('2030-12-31') }),
      (movements, ref) => {
        const buckets = twelveMonthTrend(movements, ref);
        if (buckets.length !== 12) return false;
        // Chronological order.
        for (let i = 1; i < buckets.length; i++) {
          const prev = buckets[i - 1].year * 12 + buckets[i - 1].month;
          const cur = buckets[i].year * 12 + buckets[i].month;
          if (cur !== prev + 1) return false;
        }
        // Each bucket total matches sum of movements in that month.
        return buckets.every((b) => {
          const expected = round2(
            movements
              .filter(
                (m) =>
                  m.createdAt.getUTCFullYear() === b.year &&
                  m.createdAt.getUTCMonth() === b.month,
              )
              .reduce((acc, m) => acc + m.quantity, 0),
          );
          return b.total === expected;
        });
      },
    ),
    RUNS,
  );
});

// Feature: inventory-management-dashboard, Property 7: Top-products ranking
test('Property 7: top-products has <=5 items, descending, exactly the true top-5', () => {
  const rankedArb = fc.record({
    id: fc.uuid(),
    salesVolume: fc.integer({ min: 0, max: 100_000 }),
  });
  fc.assert(
    fc.property(fc.uniqueArray(rankedArb, { selector: (r) => r.id }), (products) => {
      const top = topProducts(products);
      if (top.length > 5) return false;
      if (top.length !== Math.min(5, products.length)) return false;
      // Descending by salesVolume.
      for (let i = 1; i < top.length; i++) {
        if (top[i - 1].salesVolume < top[i].salesVolume) return false;
      }
      // No excluded product has a higher volume than an included one.
      const includedIds = new Set(top.map((t) => t.id));
      const minIncluded = Math.min(...top.map((t) => t.salesVolume));
      const excluded = products.filter((p) => !includedIds.has(p.id));
      return top.length === 0 || excluded.every((e) => e.salesVolume <= minIncluded);
    }),
    RUNS,
  );
});
