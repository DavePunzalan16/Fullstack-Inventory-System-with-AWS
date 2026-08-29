/**
 * Property-based test for security response invariants & error sanitization
 * (Property 30). Verifies nosniff is always set and error bodies never leak
 * stack traces, file-system paths, or secrets.
 */

import fc from 'fast-check';

// Silence the structured logger during this test (it deliberately triggers 500s).
jest.mock('../config/logger', () => ({
  logger: { error: () => undefined, info: () => undefined },
}));

import { errorHandler } from './error';
import { ForbiddenError, NotFoundError, ValidationError } from '../lib/errors';

/** Minimal Response stub capturing status, headers, and JSON body. */
function makeRes() {
  const headers: Record<string, string> = {};
  const state: { status: number; body: unknown } = { status: 0, body: undefined };
  const res = {
    setHeader(name: string, value: string) {
      headers[name] = value;
    },
    status(code: number) {
      state.status = code;
      return res;
    },
    json(body: unknown) {
      state.body = body;
      return res;
    },
  };
  return { res, headers, state };
}

// Feature: inventory-management-dashboard, Property 30: Security response invariants and error sanitization
test('Property 30: nosniff always set; error bodies contain no stack/paths/secrets', () => {
  const secret = 'super-secret-key-ABC123';
  const errorArb = fc.oneof(
    fc.constant(new ForbiddenError()),
    fc.constant(new NotFoundError('Product not found')),
    fc.constant(new ValidationError([{ field: 'x', message: 'bad' }])),
    fc.constant(
      Object.assign(new Error('boom at C:\\Users\\app\\src\\index.ts'), {
        stack: 'Error: boom\n at C:\\Users\\app\\src\\index.ts:10:5',
        secret,
      }),
    ),
  );

  fc.assert(
    fc.property(errorArb, (err) => {
      const { res, headers, state } = makeRes();
      errorHandler(err, {} as never, res as never, (() => undefined) as never);

      if (headers['X-Content-Type-Options'] !== 'nosniff') return false;

      const serialized = JSON.stringify(state.body);
      // No stack traces, Windows/Unix paths, or secret values in the body.
      if (/\bat\s+[A-Za-z]:\\/.test(serialized)) return false;
      if (serialized.includes('src\\index.ts') || serialized.includes('src/index.ts')) return false;
      if (serialized.includes(secret)) return false;
      return state.status >= 400;
    }),
    { numRuns: 200 },
  );
});
