/**
 * Property-based test for the RBAC decision (Property 15).
 */

import fc from 'fast-check';

import { isAuthorized } from './authorize';
import type { Role } from '../types';

// Feature: inventory-management-dashboard, Property 15: Unified backend RBAC decision
test('Property 15: admin read+write; staff read-only; missing/unrecognized denied', () => {
  const roleArb = fc.constantFrom<Role | undefined | string>(
    'admin',
    'staff',
    undefined,
    '',
    'superuser',
    'ADMIN',
  );

  fc.assert(
    fc.property(roleArb, fc.boolean(), (role, isWrite) => {
      const allowed: Role[] = isWrite ? ['admin'] : ['admin', 'staff'];
      const decision = isAuthorized(role as Role | undefined, allowed);

      if (role === 'admin') {
        return decision === true; // admin allowed on read and write
      }
      if (role === 'staff') {
        return decision === !isWrite; // staff allowed only on read
      }
      // Missing/empty/unrecognized -> always denied.
      return decision === false;
    }),
    { numRuns: 200 },
  );
});
