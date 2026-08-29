/**
 * Property-based test for expense category breakdown (Property 6).
 */

import fc from 'fast-check';

import { categoryBreakdown, round2, type ExpenseLike } from './expense.service';

// Feature: inventory-management-dashboard, Property 6: Expense category breakdown
test('Property 6: each category sums its amounts; segment totals sum to grand total', () => {
  const expenseArb = fc.record({
    category: fc.constantFrom('Utilities', 'Rent', 'Supplies', 'Marketing', 'Other'),
    amount: fc.double({ min: 0, max: 100_000, noNaN: true }),
  });

  fc.assert(
    fc.property(fc.array(expenseArb), (expenses: ExpenseLike[]) => {
      const breakdown = categoryBreakdown(expenses);

      // Each category total equals the sum of its amounts (within rounding).
      for (const [cat, total] of Object.entries(breakdown)) {
        const expected = round2(
          expenses
            .filter((e) => e.category === cat)
            .reduce((acc, e) => acc + e.amount, 0),
        );
        if (Math.abs(total - expected) > 0.011) return false;
      }

      // Sum of segments equals grand total (within accumulated rounding).
      const segmentSum = Object.values(breakdown).reduce((a, b) => a + b, 0);
      const grandTotal = expenses.reduce((acc, e) => acc + e.amount, 0);
      const categoryCount = Object.keys(breakdown).length;
      return Math.abs(segmentSum - grandTotal) <= 0.01 * (categoryCount + 1);
    }),
    { numRuns: 200 },
  );
});
