/**
 * Property-based test for admin-only UI gating (Property 17).
 */

import fc from 'fast-check';

import { isAdminRole } from './RoleGate';

// Feature: inventory-management-dashboard, Property 17: Admin-only UI gating decision
test('Property 17: admin-only controls render iff the role is exactly "admin"', () => {
  const roleArb = fc.oneof(
    fc.constantFrom('admin', 'staff'),
    fc.constant(undefined),
    fc.constant(null),
    fc.constant(''),
    fc.constantFrom('ADMIN', 'Admin', 'superuser', 'root'),
    fc.string(),
  );

  fc.assert(
    fc.property(roleArb, (role) => {
      const decision = isAdminRole(role as string | null | undefined);
      return decision === (role === 'admin');
    }),
    { numRuns: 300 },
  );
});
