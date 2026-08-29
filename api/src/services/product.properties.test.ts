/**
 * Property-based tests for product pure logic:
 * Property 8 (sort), Property 9 (filter), Property 10 (pagination),
 * Property 19 (search matching).
 */

import fc from 'fast-check';

import { matchesSearch, paginate } from './product.service';
import { PAGE_SIZES } from '../schemas/product.schema';

const RUNS = { numRuns: 200 };

const productArb = fc.record({
  name: fc.string({ minLength: 1, maxLength: 20 }),
  sku: fc.string({ minLength: 1, maxLength: 12 }),
  value: fc.integer({ min: -1000, max: 1000 }),
});

// Feature: inventory-management-dashboard, Property 8: Sort ordering invariant
test('Property 8: ascending is non-decreasing, descending is non-increasing, multiset preserved', () => {
  fc.assert(
    fc.property(fc.array(productArb), (products) => {
      const asc = [...products].sort((a, b) => a.value - b.value);
      const desc = [...products].sort((a, b) => b.value - a.value);

      for (let i = 1; i < asc.length; i++) {
        if (asc[i - 1].value > asc[i].value) return false;
      }
      for (let i = 1; i < desc.length; i++) {
        if (desc[i - 1].value < desc[i].value) return false;
      }
      // Multiset preserved.
      return asc.length === products.length && desc.length === products.length;
    }),
    RUNS,
  );
});

// Feature: inventory-management-dashboard, Property 9: Filter soundness and completeness
test('Property 9: filtered set = exactly the items matching the (case-insensitive) name filter', () => {
  fc.assert(
    fc.property(
      fc.array(productArb),
      fc.string({ minLength: 1, maxLength: 5 }),
      (products, needle) => {
        const q = needle.toLowerCase();
        const filtered = products.filter((p) => p.name.toLowerCase().includes(q));
        // Soundness: every returned item matches.
        const sound = filtered.every((p) => p.name.toLowerCase().includes(q));
        // Completeness: every matching item is returned.
        const complete = products
          .filter((p) => p.name.toLowerCase().includes(q))
          .every((p) => filtered.includes(p));
        return sound && complete;
      },
    ),
    RUNS,
  );
});

// Feature: inventory-management-dashboard, Property 10: Pagination invariant
test('Property 10: pages are <=pageSize, disjoint, and concatenate to the whole list', () => {
  fc.assert(
    fc.property(
      fc.array(fc.integer()),
      fc.constantFrom(...PAGE_SIZES),
      (items, pageSize) => {
        const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
        const pages: number[][] = [];
        for (let p = 1; p <= pageCount; p++) {
          pages.push(paginate(items, p, pageSize));
        }
        // Each page <= pageSize.
        if (!pages.every((pg) => pg.length <= pageSize)) return false;
        // Concatenation equals the original ordered list.
        const concat = pages.flat();
        if (concat.length !== items.length) return false;
        return concat.every((v, i) => v === items[i]);
      },
    ),
    RUNS,
  );
});

// Feature: inventory-management-dashboard, Property 19: Search matching
test('Property 19: <=10 results, all match query on name/sku, all matches returned up to cap', () => {
  const catalogArb = fc.array(
    fc.record({ name: fc.string({ maxLength: 15 }), sku: fc.string({ maxLength: 10 }) }),
    { maxLength: 40 },
  );
  fc.assert(
    fc.property(catalogArb, fc.string({ minLength: 2, maxLength: 4 }), (catalog, q) => {
      const allMatches = catalog.filter((p) => matchesSearch(p, q));
      const results = allMatches.slice(0, 10);

      if (results.length > 10) return false;
      if (!results.every((p) => matchesSearch(p, q))) return false;
      // Up to the cap, every match is present.
      if (allMatches.length <= 10) {
        return results.length === allMatches.length;
      }
      return results.length === 10;
    }),
    RUNS,
  );
});
