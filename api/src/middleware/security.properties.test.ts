/**
 * Property-based test for CORS-by-origin (Property 27).
 */

import fc from 'fast-check';

import { isOriginAllowed } from './security';

// Feature: inventory-management-dashboard, Property 27: CORS by origin
test('Property 27: origin allowed iff configured or localhost; otherwise omitted', () => {
  const allowed = ['https://app.example.com', 'https://inventory.example.com'];

  const localhostArb = fc
    .tuple(
      fc.constantFrom('http', 'https'),
      fc.constantFrom('localhost', '127.0.0.1', '[::1]'),
      fc.option(fc.integer({ min: 1, max: 65535 }), { nil: undefined }),
    )
    .map(([scheme, host, port]) => `${scheme}://${host}${port ? `:${port}` : ''}`);

  const originArb = fc.oneof(
    fc.constantFrom(...allowed),
    localhostArb,
    fc.webUrl(),
    fc.constantFrom('https://evil.example.org', 'http://attacker.test'),
  );

  fc.assert(
    fc.property(originArb, (origin) => {
      const decision = isOriginAllowed(origin, allowed);
      const isConfigured = allowed.includes(origin);
      const isLocal = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/i.test(origin);
      return decision === (isConfigured || isLocal);
    }),
    { numRuns: 300 },
  );

  // A request with no Origin header is permitted (same-origin / non-browser).
  expect(isOriginAllowed(undefined, allowed)).toBe(true);
});
