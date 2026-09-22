/**
 * Property-based test for stock-movement signed delta (Property 31, pure part).
 * The persistence/stock-adjustment and history ordering (Property 32) are
 * additionally covered by integration tests against the DB.
 */

import type { MovementType } from '@prisma/client';
import fc from 'fast-check';

import { signedDelta } from './stockMovement.service';

// Feature: inventory-management-dashboard, Property 31: Stock movement creation and stock delta
test('Property 31: sale decreases, restock increases, adjustment applies as-is', () => {
  fc.assert(
    fc.property(
      fc.constantFrom<MovementType>('restock', 'sale', 'adjustment'),
      fc.integer({ min: -999_999, max: 999_999 }).filter((n) => n !== 0),
      (type, quantity) => {
        const delta = signedDelta(type, quantity);
        if (type === 'restock') return delta === Math.abs(quantity);
        if (type === 'sale') return delta === -Math.abs(quantity);
        return delta === quantity; // adjustment
      },
    ),
    { numRuns: 200 },
  );
});
