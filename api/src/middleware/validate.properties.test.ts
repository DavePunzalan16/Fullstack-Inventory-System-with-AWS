/**
 * Property-based tests for validation and sanitization:
 * Property 24 (unified validation rejection), Property 25 (length limit + sanitization).
 */

import fc from 'fast-check';
import { z } from 'zod';

import {
  MAX_STRING_LENGTH,
  hasOverlongString,
  sanitizeString,
  validate,
} from './validate';
import { ValidationError } from '../lib/errors';

const RUNS = { numRuns: 200 };

/** Runs the validate middleware and returns the error passed to next (if any). */
function runValidate(
  schemas: Parameters<typeof validate>[0],
  req: { body?: unknown; query?: unknown; params?: unknown },
): Promise<unknown> {
  return new Promise((resolve) => {
    const mw = validate(schemas);
    mw(req as never, {} as never, (err?: unknown) => resolve(err));
  });
}

// Feature: inventory-management-dashboard, Property 24: Unified validation rejection
test('Property 24: schema-violating input yields 400 ValidationError with field info', async () => {
  const schema = z.object({ amount: z.number().min(0.01), name: z.string().min(1) });

  await fc.assert(
    fc.asyncProperty(
      // Bodies that violate the schema: negative amount and/or empty name.
      fc.record({
        amount: fc.oneof(fc.constant(-1), fc.constant(0), fc.string()),
        name: fc.constant(''),
      }),
      async (badBody) => {
        const err = await runValidate({ body: schema }, { body: badBody });
        return (
          err instanceof ValidationError &&
          err.status === 400 &&
          Array.isArray(err.fields) &&
          err.fields.length > 0
        );
      },
    ),
    RUNS,
  );
});

// Feature: inventory-management-dashboard, Property 25: String length limit and sanitization
test('Property 25: >10k strings rejected; accepted strings are neutralized', async () => {
  const schema = z.object({ text: z.string() });

  // Overlong strings are rejected with 400.
  await fc.assert(
    fc.asyncProperty(
      fc.integer({ min: MAX_STRING_LENGTH + 1, max: MAX_STRING_LENGTH + 50 }),
      async (len) => {
        const body = { text: 'a'.repeat(len) };
        const err = await runValidate({ body: schema }, { body });
        return err instanceof ValidationError && err.status === 400;
      },
    ),
    { numRuns: 50 },
  );

  // Sanitized output never contains raw markup characters.
  fc.assert(
    fc.property(fc.string(), (input) => {
      if (hasOverlongString(input)) return true; // out of scope for this check
      const out = sanitizeString(input);
      return !/[<>]/.test(out) && !out.includes('"') && !/'/.test(out);
    }),
    RUNS,
  );
});
