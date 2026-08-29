/**
 * Property-based tests for authentication/role resolution:
 * Property 16 (role resolution precedence), Property 22 (missing-token),
 * Property 23 (expired-token rejection).
 */

import fc from 'fast-check';

import {
  createAuthMiddleware,
  resolveRole,
  type RoleLookup,
  type VerifiedClaims,
} from './auth';
import { UnauthorizedError } from '../lib/errors';
import type { Role } from '../types';

const RUNS = { numRuns: 200 };

// Feature: inventory-management-dashboard, Property 16: Role resolution precedence
test('Property 16: JWT claim role wins when present; else DB role is used', async () => {
  const roleArb = fc.constantFrom<Role>('admin', 'staff');
  const maybeClaimRole = fc.option(roleArb, { nil: undefined });
  const dbRole = fc.option(roleArb, { nil: undefined });

  await fc.assert(
    fc.asyncProperty(maybeClaimRole, dbRole, async (claimRole, dbLookupRole) => {
      const claims: VerifiedClaims = {
        sub: 'user-1',
        ...(claimRole ? { 'custom:role': claimRole } : {}),
      };
      const lookup: RoleLookup = async () => dbLookupRole;
      const resolved = await resolveRole(claims, lookup);
      const expected = claimRole ?? dbLookupRole;
      return resolved === expected;
    }),
    RUNS,
  );
});

// Feature: inventory-management-dashboard, Property 22: Missing-token rejection
test('Property 22: requests without a valid bearer token are rejected 401, no verify call', async () => {
  const headerArb = fc.constantFrom<string | undefined>(
    undefined,
    '',
    'Token abc',
    'Bearer',
    'Bearer   ',
    'bearer', // no token
  );

  await fc.assert(
    fc.asyncProperty(headerArb, async (authHeader) => {
      let verifyCalled = false;
      const mw = createAuthMiddleware({
        verifyToken: async () => {
          verifyCalled = true;
          return { sub: 'x' };
        },
        lookupRole: async () => 'admin',
      });

      let captured: unknown;
      const req = { headers: authHeader === undefined ? {} : { authorization: authHeader } } as never;
      await new Promise<void>((resolve) => {
        mw(req, {} as never, (err?: unknown) => {
          captured = err;
          resolve();
        });
      });

      return captured instanceof UnauthorizedError && verifyCalled === false;
    }),
    RUNS,
  );
});

// Feature: inventory-management-dashboard, Property 23: Expired-token rejection
test('Property 23: expired tokens yield 401 with an expiration message', async () => {
  // A well-formed (non-empty, non-whitespace) token whose verification reports
  // expiry. Whitespace-only strings are excluded: those are "malformed token"
  // (Property 22 territory), not "present-but-expired".
  const tokenArb = fc
    .string({ minLength: 1, maxLength: 20 })
    .filter((t) => t.trim().length > 0);

  await fc.assert(
    fc.asyncProperty(tokenArb, async (token) => {
      const mw = createAuthMiddleware({
        verifyToken: async () => {
          throw new Error('Token is expired');
        },
        lookupRole: async () => 'admin',
      });

      let captured: unknown;
      const req = { headers: { authorization: `Bearer ${token}` } } as never;
      await new Promise<void>((resolve) => {
        mw(req, {} as never, (err?: unknown) => {
          captured = err;
          resolve();
        });
      });

      return (
        captured instanceof UnauthorizedError &&
        /expir/i.test((captured as UnauthorizedError).message)
      );
    }),
    RUNS,
  );
});
